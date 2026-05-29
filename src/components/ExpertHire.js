"use client";
import { useState, useEffect } from "react";

// ── Role config ────────────────────────────────────────────────────────────────

const ROLES = {
  marketing:   { name: "Head of Marketing",        icon: "📣", color: "#8B5CF6", grad: "linear-gradient(135deg,#8B5CF6,#6D28D9)", desc: "Awareness, acquisition, and brand growth." },
  sales:       { name: "Head of Sales",            icon: "💼", color: "#0066CC", grad: "linear-gradient(135deg,#0066CC,#0047A0)", desc: "Pipeline, deal-closing, and revenue motion." },
  engineering: { name: "CTO / Engineering Lead",   icon: "⚙️", color: "#06B6D4", grad: "linear-gradient(135deg,#06B6D4,#0891B2)", desc: "Product build, tech stack, and shipping." },
  design:      { name: "Head of Design",           icon: "🎨", color: "#EC4899", grad: "linear-gradient(135deg,#EC4899,#BE185D)", desc: "UX, brand identity, and product experience." },
  finance:     { name: "CFO / Finance Lead",       icon: "📊", color: "#F59E0B", grad: "linear-gradient(135deg,#F59E0B,#D97706)", desc: "Runway, burn rate, and financial strategy." },
  ops:         { name: "COO / Head of Operations", icon: "⚡", color: "#10B981", grad: "linear-gradient(135deg,#10B981,#059669)", desc: "Process, efficiency, and execution velocity." },
  growth:      { name: "Head of Growth",           icon: "📈", color: "#F97316", grad: "linear-gradient(135deg,#F97316,#EA580C)", desc: "Activation, retention, and viral loops." },
  custom:      { name: "Custom Role",              icon: "🤝", color: "#6B7280", grad: "linear-gradient(135deg,#6B7280,#4B5563)", desc: "Define your own specialist hire." },
};

const TIMELINES = [
  { days: 7,  label: "7 days",  sub: "Quick sprint" },
  { days: 14, label: "14 days", sub: "2-week push" },
  { days: 30, label: "30 days", sub: "Monthly arc" },
  { days: 60, label: "60 days", sub: "2-month run" },
  { days: 90, label: "90 days", sub: "Full quarter" },
];

const MOODS = ["🔥 Crushing it", "😎 Solid progress", "😐 Grinding", "😰 Struggling", "😵 Blocked"];

const MAX_SPRINTS = 6;

function roleColor(role) { return ROLES[role]?.color || "#6B7280"; }
function roleGrad(role)  { return ROLES[role]?.grad  || "linear-gradient(135deg,#6B7280,#4B5563)"; }

// ── Shared styles ──────────────────────────────────────────────────────────────

const labelStyle = {
  display: "block", fontWeight: 600, fontSize: 13,
  color: "rgba(255,255,255,.7)", marginBottom: 6,
};
const inputStyle = {
  width: "100%", border: "1px solid var(--edai-border)", borderRadius: 9,
  padding: "10px 12px", fontSize: 14, fontFamily: "var(--ff-body)",
  boxSizing: "border-box", outline: "none", marginBottom: 18,
  background: "var(--edai-surface-2)", color: "var(--edai-text)",
};

function tabStyle(active, color) {
  return {
    background: active ? roleGrad(color) : "var(--edai-surface-2)",
    color: active ? "#fff" : "rgba(255,255,255,.65)",
    border: active ? "none" : "1px solid var(--edai-border)",
    borderRadius: 8, padding: "7px 14px", fontWeight: 700,
    fontSize: 13, cursor: "pointer", fontFamily: "var(--ff-body)",
  };
}

// ── Onboarding ─────────────────────────────────────────────────────────────────

function Onboarding({ onCreate, creating, onBack, error }) {
  const [role, setRole] = useState("marketing");
  const [customRoleName, setCustomRoleName] = useState("");
  const [goal, setGoal] = useState("");
  const [timeline, setTimeline] = useState(30);
  const [startupContext, setStartupContext] = useState("");

  const canSubmit = goal.trim().length > 10 && (role !== "custom" || customRoleName.trim());

  if (creating) {
    const cfg = ROLES[role] || ROLES.custom;
    return (
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 18 }}>{cfg.icon}</div>
        <h2 style={{ fontFamily: "var(--ff-heading)", fontSize: 24, fontWeight: 700, color: "var(--edai-text)", margin: "0 0 12px" }}>
          {cfg.name} is building your plan…
        </h2>
        <p style={{ color: "var(--edai-muted)", fontSize: 15, lineHeight: 1.6 }}>
          Mapping out each day of your {timeline}-day sprint. This takes a moment.
        </p>
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 24 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: roleColor(role), animation: `ffBounce .9s ${i * 0.15}s infinite` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px" }}>
      {onBack && (
        <button onClick={onBack} style={{ marginBottom: 20, background: "none", border: "none", color: "rgba(255,255,255,.35)", fontSize: 13, cursor: "pointer", fontFamily: "var(--ff-body)", display: "flex", alignItems: "center", gap: 5, padding: 0 }}>
          ← Back to sprints
        </button>
      )}

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ display: "inline-block", background: roleGrad(role), color: "#fff", fontWeight: 700, fontSize: 12, padding: "5px 14px", borderRadius: 99, marginBottom: 16, letterSpacing: ".06em" }}>
          EXPERT HIRE
        </div>
        <h2 style={{ fontFamily: "var(--ff-heading)", fontSize: 28, fontWeight: 700, color: "var(--edai-text)", margin: "0 0 10px", lineHeight: 1.2 }}>
          Hire a world-class expert.<br />Give them a goal. Watch it happen.
        </h2>
        <p style={{ color: "var(--edai-muted)", fontSize: 15, maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
          Define the role you need and what they must achieve. Your AI expert will build a day-by-day execution plan and coach you through it.
        </p>
      </div>

      {/* Role picker */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ ...labelStyle, marginBottom: 12 }}>Who are you hiring?</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(145px, 1fr))", gap: 8 }}>
          {Object.entries(ROLES).map(([key, cfg]) => {
            const active = role === key;
            return (
              <button key={key} onClick={() => setRole(key)} style={{
                padding: "12px 10px", borderRadius: 10, textAlign: "left", cursor: "pointer",
                fontFamily: "var(--ff-body)", transition: "all .15s",
                border: `1.5px solid ${active ? cfg.color : "var(--edai-border)"}`,
                background: active ? `${cfg.color}18` : "var(--edai-surface)",
              }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{cfg.icon}</div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: active ? cfg.color : "rgba(255,255,255,.75)", lineHeight: 1.3, marginBottom: 4 }}>{cfg.name}</div>
                <div style={{ fontSize: 11, color: "var(--edai-muted)", lineHeight: 1.4 }}>{cfg.desc}</div>
              </button>
            );
          })}
        </div>

        {role === "custom" && (
          <input
            value={customRoleName}
            onChange={(e) => setCustomRoleName(e.target.value)}
            placeholder="e.g. Head of Customer Success, PR Lead, Legal Advisor…"
            style={{ ...inputStyle, marginTop: 12, marginBottom: 0 }}
            maxLength={80}
          />
        )}
      </div>

      {/* Goal + context */}
      <div style={{ background: "var(--edai-surface)", border: "1px solid var(--edai-border)", borderRadius: 16, padding: 24 }}>
        <label style={labelStyle}>What is their goal? (be specific)</label>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder={role === "marketing"
            ? "e.g. Get 200 qualified leads and 10 paying customers in 30 days through content + outreach"
            : role === "sales"
            ? "e.g. Close $20K in new MRR from outbound in 30 days"
            : "e.g. Ship a working MVP with auth, payments, and core feature in 14 days"}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
          maxLength={500}
        />

        <label style={labelStyle}>Sprint timeline</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
          {TIMELINES.map((t) => {
            const active = timeline === t.days;
            return (
              <button key={t.days} onClick={() => setTimeline(t.days)} style={{
                padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "var(--ff-body)",
                border: `1.5px solid ${active ? roleColor(role) : "var(--edai-border)"}`,
                background: active ? `${roleColor(role)}18` : "var(--edai-surface-2)",
                color: active ? roleColor(role) : "rgba(255,255,255,.6)", fontWeight: active ? 700 : 400,
              }}>
                <span style={{ fontSize: 13 }}>{t.label}</span>
                <span style={{ display: "block", fontSize: 10, opacity: .6, marginTop: 1 }}>{t.sub}</span>
              </button>
            );
          })}
        </div>

        <label style={labelStyle}>Startup context <span style={{ fontWeight: 400, color: "var(--edai-muted)" }}>(optional — helps the expert personalise the plan)</span></label>
        <textarea
          value={startupContext}
          onChange={(e) => setStartupContext(e.target.value)}
          placeholder="e.g. B2B SaaS for restaurant ops, 3 months old, $0 revenue, 5 beta users, built by 2 technical founders"
          rows={2}
          style={{ ...inputStyle, resize: "vertical", marginBottom: 8 }}
          maxLength={400}
        />

        {error && (
          <div style={{ marginBottom: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(224,90,71,.12)", border: "1px solid rgba(224,90,71,.3)", fontSize: 13, color: "#FF8888", fontFamily: "var(--ff-body)" }}>
            {error}
          </div>
        )}

        <button
          onClick={() => canSubmit && onCreate({ role, roleName: customRoleName, goal, timeline, startupContext })}
          disabled={!canSubmit}
          className="ff-btn-accent"
          style={{ width: "100%", background: canSubmit ? roleGrad(role) : "rgba(255,255,255,.05)", color: canSubmit ? "#fff" : "rgba(255,255,255,.2)", border: "none", borderRadius: 10, padding: "14px 0", fontWeight: 700, fontSize: 15, cursor: canSubmit ? "pointer" : "not-allowed", fontFamily: "var(--ff-body)", marginTop: 4 }}
        >
          Hire my {ROLES[role]?.name || "Expert"} →
        </button>
      </div>
    </div>
  );
}

// ── Check-in Modal ─────────────────────────────────────────────────────────────

function CheckinModal({ sprint, day, onClose, onSubmit, submitting }) {
  const [summary, setSummary] = useState("");
  const [blockers, setBlockers] = useState("");
  const [metric, setMetric] = useState("");
  const [mood, setMood] = useState("");
  const color = roleColor(sprint.role);
  const grad = roleGrad(sprint.role);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(3,8,7,.72)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "var(--edai-surface)", border: "1px solid var(--edai-border)", borderRadius: 18, padding: 28, width: 520, maxWidth: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 80px rgba(0,0,0,.6)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ background: grad, color: "#fff", fontWeight: 700, fontSize: 11, padding: "2px 8px", borderRadius: 5 }}>DAY {day.dayNumber}</span>
          <h3 style={{ fontFamily: "var(--ff-heading)", fontSize: 19, fontWeight: 700, color: "var(--edai-text)", margin: 0 }}>Daily report</h3>
        </div>
        <p style={{ color: "var(--edai-muted)", fontSize: 13, margin: "0 0 18px" }}>Report honestly. Your plan adapts to what you write.</p>

        <label style={labelStyle}>What did you get done today?</label>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Ran 3 outreach sessions, published the launch post, booked 4 demos…" rows={3} style={{ ...inputStyle, resize: "vertical" }} maxLength={2000} />

        <label style={labelStyle}>What&apos;s blocking you or worrying you?</label>
        <textarea value={blockers} onChange={(e) => setBlockers(e.target.value)} placeholder="Low reply rate on cold email. Not sure if positioning is right." rows={2} style={{ ...inputStyle, resize: "vertical" }} maxLength={1000} />

        <label style={labelStyle}>Key metric update <span style={{ fontWeight: 400, color: "var(--edai-muted)" }}>(optional)</span></label>
        <input value={metric} onChange={(e) => setMetric(e.target.value)} placeholder="e.g. 4 leads, $500 pipeline, 2 demos booked" style={inputStyle} maxLength={200} />

        <label style={labelStyle}>How are you feeling?</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 22 }}>
          {MOODS.map((m) => (
            <button key={m} onClick={() => setMood(m)} style={{ padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${mood === m ? color : "var(--edai-border)"}`, background: mood === m ? `${color}18` : "var(--edai-surface-2)", color: mood === m ? color : "var(--edai-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--ff-body)" }}>{m}</button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} className="ff-ghost" style={{ background: "var(--edai-surface-2)", color: "rgba(255,255,255,.7)", border: "1px solid var(--edai-border)", borderRadius: 9, padding: "10px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "var(--ff-body)" }}>Cancel</button>
          <button
            onClick={() => onSubmit({ summary, blockers, metric, mood })}
            disabled={submitting || !summary.trim()}
            className="ff-btn-accent"
            style={{ background: grad, color: "#fff", border: "none", borderRadius: 9, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "var(--ff-body)", opacity: (submitting || !summary.trim()) ? 0.45 : 1 }}
          >
            {submitting ? "Submitting…" : "Report & unlock tomorrow →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Today Panel ────────────────────────────────────────────────────────────────

function TodayPanel({ sprint, day, onToggleTask, onOpenCheckin }) {
  const tasks = Array.isArray(day.tasks) ? day.tasks : [];
  const color = roleColor(sprint.role);
  const grad = roleGrad(sprint.role);
  const cfg = ROLES[sprint.role] || ROLES.custom;
  const phase = (sprint.phases || []).find((p) => day.dayNumber >= p.dayStart && day.dayNumber <= p.dayEnd);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "8px 24px 40px" }}>
      {phase && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: ".05em" }}>{phase.name}</span>
          <span style={{ color: "rgba(255,255,255,.3)", fontSize: 12 }}>· Days {phase.dayStart}–{phase.dayEnd}</span>
        </div>
      )}

      <div style={{ background: "var(--edai-surface)", border: "1px solid var(--edai-border)", borderRadius: 16, padding: 28, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
          <span style={{ background: "rgba(255,255,255,.08)", color: "var(--edai-text)", fontWeight: 700, fontSize: 13, padding: "3px 10px", borderRadius: 6 }}>DAY {day.dayNumber}</span>
          <h2 style={{ fontFamily: "var(--ff-heading)", fontSize: 22, fontWeight: 700, color: "var(--edai-text)", margin: 0 }}>{day.theme}</h2>
        </div>
        <p style={{ color: "rgba(255,255,255,.7)", fontSize: 15, lineHeight: 1.6, margin: "0 0 20px" }}>{day.objective}</p>

        {day.expertNote && (
          <div style={{ background: `${color}14`, borderLeft: `3px solid ${color}`, borderRadius: 8, padding: "12px 14px", marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>{sprint.expertName} says</div>
            <div style={{ fontSize: 14, color: "rgba(220,220,255,.88)", lineHeight: 1.55, fontStyle: "italic" }}>{day.expertNote}</div>
          </div>
        )}

        {tasks.length > 0 ? (
          <>
            <div style={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,.7)", marginBottom: 12, textTransform: "uppercase", letterSpacing: ".05em" }}>Today&apos;s tasks</div>
            {tasks.map((t, i) => (
              <div key={i} onClick={() => onToggleTask(day.dayNumber, i, !t.done)} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: i < tasks.length - 1 ? "1px solid var(--edai-border)" : "none", cursor: "pointer" }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${t.done ? color : "rgba(255,255,255,.25)"}`, background: t.done ? color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  {t.done && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                </div>
                <span style={{ fontSize: 14, color: t.done ? "rgba(255,255,255,.35)" : "var(--edai-text)", textDecoration: t.done ? "line-through" : "none", lineHeight: 1.5 }}>{t.text}</span>
              </div>
            ))}
          </>
        ) : (
          <div style={{ color: "rgba(255,255,255,.35)", fontSize: 14, textAlign: "center", padding: "16px 0" }}>
            Tasks for this day are still generating. Check back in a moment.
          </div>
        )}

        {day.rationale && (
          <div style={{ marginTop: 16, fontSize: 13, color: "var(--edai-muted)", lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700 }}>Why this matters:</span> {day.rationale}
          </div>
        )}
      </div>

      <button onClick={onOpenCheckin} className="ff-btn-accent"
        style={{ width: "100%", background: grad, color: "#fff", border: "none", borderRadius: 12, padding: "15px 0", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "var(--ff-body)" }}>
        Report Day {day.dayNumber} & unlock Day {day.dayNumber + 1} →
      </button>

      {day.report?.feedback && (
        <div style={{ marginTop: 20, background: `${color}12`, border: `1px solid ${color}40`, borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 5 }}>{sprint.expertName}&apos;s feedback on your last report</div>
          <div style={{ fontSize: 14, color: "rgba(220,235,255,.85)", lineHeight: 1.55 }}>{day.report.feedback}</div>
        </div>
      )}
    </div>
  );
}

// ── Roadmap ────────────────────────────────────────────────────────────────────

function Roadmap({ sprint, onPickDay }) {
  const phases = sprint.phases || [];
  const color = roleColor(sprint.role);
  const grad = roleGrad(sprint.role);
  const daysByPhase = phases.map((p) => ({
    phase: p,
    days: sprint.days.filter((d) => d.dayNumber >= p.dayStart && d.dayNumber <= p.dayEnd),
  }));
  const ungrouped = sprint.days.filter((d) => !phases.some((p) => d.dayNumber >= p.dayStart && d.dayNumber <= p.dayEnd));

  const renderDays = (days) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8, paddingLeft: phases.length > 0 ? 38 : 0 }}>
      {days.map((d) => {
        const isCurrent = d.dayNumber === sprint.currentDay;
        const isDone = d.status === "done";
        return (
          <button key={d.id} onClick={() => onPickDay(d)} className="ff-row-hover"
            style={{ textAlign: "left", background: isCurrent ? `${color}18` : "var(--edai-surface)", border: `1px solid ${isCurrent ? color : isDone ? "var(--ff-accent-border)" : "var(--edai-border)"}`, borderRadius: 9, padding: "8px 10px", cursor: "pointer", fontFamily: "var(--ff-body)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: isCurrent ? color : isDone ? "var(--ff-accent)" : "rgba(255,255,255,.4)" }}>DAY {d.dayNumber}</span>
              {isDone && <span style={{ fontSize: 11, color: "var(--ff-accent)" }}>✓</span>}
              {isCurrent && <span style={{ fontSize: 10, background: color, color: "#fff", padding: "0 5px", borderRadius: 4, fontWeight: 700 }}>NOW</span>}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.65)", fontWeight: 600, lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{d.theme}</div>
          </button>
        );
      })}
    </div>
  );

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "8px 24px 40px" }}>
      {daysByPhase.map(({ phase, days }, pi) => (
        <div key={pi} style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: grad, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{pi + 1}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--edai-text)" }}>{phase.name}</div>
              <div style={{ fontSize: 12, color: "var(--edai-muted)" }}>Days {phase.dayStart}–{phase.dayEnd} · {phase.milestone}</div>
            </div>
          </div>
          {renderDays(days)}
        </div>
      ))}
      {ungrouped.length > 0 && renderDays(ungrouped)}
    </div>
  );
}

// ── Day Detail Modal ───────────────────────────────────────────────────────────

function DayDetailModal({ sprint, day, onClose }) {
  const tasks = Array.isArray(day.tasks) ? day.tasks : [];
  const color = roleColor(sprint.role);
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
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--edai-muted)", textTransform: "uppercase", marginBottom: 8 }}>Your report</div>
            {day.report.summary && <p style={{ fontSize: 13, color: "rgba(255,255,255,.7)", margin: "0 0 8px", lineHeight: 1.5 }}><b>Did:</b> {day.report.summary}</p>}
            {day.report.blockers && <p style={{ fontSize: 13, color: "rgba(255,255,255,.7)", margin: "0 0 8px", lineHeight: 1.5 }}><b>Blockers:</b> {day.report.blockers}</p>}
            {day.report.metric && <p style={{ fontSize: 12, color: "var(--edai-muted)", margin: "0 0 8px" }}>Metric: {day.report.metric}</p>}
            {day.report.mood && <p style={{ fontSize: 12, color: "var(--edai-muted)", margin: day.report.feedback ? "0 0 12px" : 0 }}>Mood: {day.report.mood}</p>}
            {day.report.feedback && (
              <div style={{ background: `${color}12`, border: `1px solid ${color}38`, borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 4, textTransform: "uppercase" }}>{sprint.expertName}&apos;s feedback</div>
                <div style={{ fontSize: 13, color: "rgba(210,225,255,.85)", lineHeight: 1.5 }}>{day.report.feedback}</div>
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

// ── About Panel ────────────────────────────────────────────────────────────────

function AboutPanel({ sprint }) {
  const cfg = ROLES[sprint.role] || ROLES.custom;
  const color = roleColor(sprint.role);
  const grad = roleGrad(sprint.role);
  const phases = sprint.phases || [];
  const doneCount = sprint.days.filter((d) => d.status === "done").length;
  const dayPct = Math.round((sprint.currentDay / sprint.timeline) * 100);

  const statCard = (label, value, sub) => (
    <div style={{ flex: 1, minWidth: 120, padding: "14px 16px", borderRadius: 12, background: "var(--edai-surface-2)", border: "1px solid var(--edai-border)" }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", color: "var(--edai-muted)", textTransform: "uppercase", marginBottom: 6, fontFamily: "var(--ff-body)" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "var(--edai-text)", fontFamily: "var(--ff-display)", letterSpacing: "-.02em" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--edai-muted)", marginTop: 3, fontFamily: "var(--ff-body)" }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "8px 24px 48px" }}>
      {/* Role identity */}
      <div style={{ padding: "24px 28px", borderRadius: 16, background: "var(--edai-surface)", border: "1px solid var(--edai-border)", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{cfg.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".16em", color, textTransform: "uppercase", marginBottom: 5, fontFamily: "var(--ff-body)" }}>Expert Hire · {sprint.timeline}-Day Sprint</div>
            <h2 style={{ fontSize: 24, fontFamily: "var(--ff-display)", fontWeight: 700, color: "var(--edai-text)", margin: "0 0 6px", letterSpacing: "-.02em", lineHeight: 1.2 }}>{sprint.roleName}</h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.55)", fontFamily: "var(--ff-body)", margin: 0 }}>Managed by {sprint.expertName}</p>
          </div>
        </div>
        <div style={{ marginTop: 18, padding: "14px 16px", borderRadius: 10, background: `${color}0E`, border: `1px solid ${color}28` }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", color, textTransform: "uppercase", marginBottom: 6, fontFamily: "var(--ff-body)" }}>The goal</div>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,.8)", fontFamily: "var(--ff-body)", lineHeight: 1.65, margin: 0 }}>{sprint.goal}</p>
        </div>
        {sprint.startupContext && (
          <p style={{ fontSize: 12.5, color: "var(--edai-muted)", fontFamily: "var(--ff-body)", lineHeight: 1.5, margin: "14px 0 0" }}>
            <b style={{ color: "rgba(255,255,255,.4)" }}>Context:</b> {sprint.startupContext}
          </p>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {statCard("Current day", `${sprint.currentDay}/${sprint.timeline}`, `${dayPct}% of sprint`)}
        {statCard("Days done", doneCount, `${sprint.timeline - sprint.currentDay} remaining`)}
        {statCard("Sprint status", sprint.status === "completed" ? "✓ Done" : sprint.status === "active" ? "Active" : "Archived", sprint.status === "completed" ? "Sprint complete!" : null)}
      </div>

      {/* Sprint progress */}
      <div style={{ padding: "18px 20px", borderRadius: 12, background: "var(--edai-surface)", border: "1px solid var(--edai-border)", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--edai-muted)", fontFamily: "var(--ff-body)", textTransform: "uppercase", letterSpacing: ".1em" }}>Sprint progress</span>
          <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: "var(--ff-body)" }}>{dayPct}%</span>
        </div>
        <div style={{ height: 10, borderRadius: 99, background: "rgba(255,255,255,.07)", overflow: "hidden" }}>
          <div style={{ width: `${dayPct}%`, height: "100%", background: grad, borderRadius: 99, transition: "width .6s ease" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,.25)", fontFamily: "var(--ff-body)" }}>Day {sprint.currentDay}</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,.25)", fontFamily: "var(--ff-body)" }}>Day {sprint.timeline}</span>
        </div>
      </div>

      {/* Phases */}
      {phases.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".16em", color: "rgba(255,255,255,.25)", textTransform: "uppercase", marginBottom: 12, fontFamily: "var(--ff-body)" }}>Execution phases</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {phases.map((ph, i) => {
              const phDone = sprint.currentDay > ph.dayEnd;
              const phCurrent = sprint.currentDay >= ph.dayStart && sprint.currentDay <= ph.dayEnd;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 10, background: phCurrent ? `${color}0A` : "var(--edai-surface)", border: `1px solid ${phCurrent ? `${color}30` : "var(--edai-border)"}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: phDone ? "var(--ff-accent-soft)" : phCurrent ? grad : "rgba(255,255,255,.05)", border: phDone ? "1px solid var(--ff-accent-border)" : "none", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: phDone ? "var(--ff-accent)" : phCurrent ? "#fff" : "rgba(255,255,255,.3)", flexShrink: 0 }}>
                    {phDone ? "✓" : i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: phCurrent ? "var(--edai-text)" : phDone ? "rgba(255,255,255,.5)" : "rgba(255,255,255,.6)", fontFamily: "var(--ff-body)" }}>{ph.name}</div>
                    <div style={{ fontSize: 11, color: "var(--edai-muted)", fontFamily: "var(--ff-body)", marginTop: 2 }}>Days {ph.dayStart}–{ph.dayEnd} · {ph.milestone}</div>
                  </div>
                  {phCurrent && <span style={{ fontSize: 10, background: color, color: "#fff", padding: "2px 7px", borderRadius: 4, fontWeight: 700, flexShrink: 0 }}>NOW</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Top-level component ────────────────────────────────────────────────────────

export default function ExpertHire() {
  const [sprints, setSprints] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [view, setView] = useState("today");
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pickedDay, setPickedDay] = useState(null);
  const [createError, setCreateError] = useState(null);

  const sprint = sprints.find((s) => s.id === activeId) || null;
  const atLimit = sprints.length >= MAX_SPRINTS;

  useEffect(() => {
    fetch("/api/expert/sprint")
      .then((r) => r.json())
      .then((d) => {
        const list = d.sprints || [];
        setSprints(list);
        if (list.length > 0) setActiveId(list[0].id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleCreate(form) {
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/expert/sprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const s = await res.json();
        setSprints((prev) => [s, ...prev]);
        setActiveId(s.id);
        setShowNew(false);
        setView("today");
      } else {
        const err = await res.json();
        setCreateError(err.error || "Failed to create sprint.");
      }
    } finally {
      setCreating(false);
    }
  }

  function updateSprint(updater) {
    setSprints((prev) => prev.map((s) => (s.id === activeId ? updater(s) : s)));
  }

  async function handleToggleTask(dayNumber, taskIndex, done) {
    updateSprint((prev) => ({
      ...prev,
      days: prev.days.map((d) => {
        if (d.dayNumber !== dayNumber) return d;
        const tasks = [...(d.tasks || [])];
        tasks[taskIndex] = { ...tasks[taskIndex], done };
        return { ...d, tasks };
      }),
    }));
    await fetch(`/api/expert/sprint/${activeId}/day/${dayNumber}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskIndex, done }),
    }).catch(() => {});
  }

  async function handleCheckin(report) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/expert/sprint/${activeId}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });
      if (res.ok) {
        const data = await res.json();
        setSprints((prev) => prev.map((s) => (s.id === activeId ? data.sprint : s)));
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
          {[0, 1, 2].map((i) => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "#8B5CF6", animation: `ffBounce 1.2s ${i * 0.15}s infinite` }} />)}
        </div>
        Loading your expert hires…
      </div>
    );
  }

  if (sprints.length === 0 || showNew) {
    return (
      <div style={{ height: "100%", overflow: "auto" }}>
        <Onboarding
          onCreate={handleCreate}
          creating={creating}
          error={createError}
          onBack={sprints.length > 0 ? () => { setShowNew(false); setCreateError(null); } : null}
        />
      </div>
    );
  }

  const color = roleColor(sprint?.role);
  const grad = roleGrad(sprint?.role);
  const currentDay = sprint?.days.find((d) => d.dayNumber === sprint.currentDay);
  const isComplete = sprint?.status === "completed";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ background: "var(--edai-surface)", borderBottom: "1px solid var(--edai-border)", padding: "12px 24px 0", flexShrink: 0 }}>

        {/* Sprint switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, overflowX: "auto", paddingBottom: 2 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".16em", color: "rgba(255,255,255,.25)", textTransform: "uppercase", fontFamily: "var(--ff-body)", flexShrink: 0, marginRight: 4 }}>Expert Hires</span>

          {sprints.map((s) => {
            const isActive = s.id === activeId;
            const sCfg = ROLES[s.role] || ROLES.custom;
            const sColor = roleColor(s.role);
            return (
              <button key={s.id} onClick={() => { setActiveId(s.id); setView("today"); }}
                style={{ flexShrink: 0, padding: "5px 12px", borderRadius: 99, border: `1.5px solid ${isActive ? sColor : "var(--edai-border)"}`, background: isActive ? `${sColor}18` : "transparent", color: isActive ? sColor : "rgba(255,255,255,.5)", fontSize: 12.5, fontWeight: isActive ? 700 : 500, cursor: "pointer", fontFamily: "var(--ff-body)", display: "flex", alignItems: "center", gap: 6, transition: "all .15s", whiteSpace: "nowrap" }}>
                {sCfg.icon} {s.roleName}
                <span style={{ fontSize: 10, opacity: .65 }}>Day {s.currentDay}/{s.timeline}</span>
                {s.status === "completed" && <span style={{ fontSize: 9, background: "var(--ff-accent)", color: "#fff", padding: "1px 5px", borderRadius: 4 }}>✓</span>}
              </button>
            );
          })}

          <button onClick={() => !atLimit && setShowNew(true)}
            title={atLimit ? `Max ${MAX_SPRINTS} expert hires reached` : "Add a new expert hire"}
            style={{ flexShrink: 0, padding: "5px 11px", borderRadius: 99, border: "1.5px dashed rgba(255,255,255,.18)", background: "transparent", color: atLimit ? "rgba(255,255,255,.18)" : "rgba(255,255,255,.4)", fontSize: 12, fontWeight: 600, cursor: atLimit ? "not-allowed" : "pointer", fontFamily: "var(--ff-body)", whiteSpace: "nowrap" }}>
            + Hire {atLimit && <span style={{ fontSize: 10, opacity: .6 }}>({sprints.length}/{MAX_SPRINTS})</span>}
          </button>
        </div>

        {/* Active sprint name + tabs */}
        {sprint && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ background: grad, color: "#fff", fontWeight: 700, fontSize: 12, padding: "3px 9px", borderRadius: 5 }}>
                  {(ROLES[sprint.role] || ROLES.custom).icon} EXPERT HIRE
                </span>
                <span style={{ fontFamily: "var(--ff-heading)", fontSize: 17, fontWeight: 700, color: "var(--edai-text)" }}>{sprint.roleName}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setView("today")}   style={tabStyle(view === "today",   sprint.role)}>Today</button>
                <button onClick={() => setView("roadmap")} style={tabStyle(view === "roadmap", sprint.role)}>Roadmap</button>
                <button onClick={() => setView("about")}   style={tabStyle(view === "about",   sprint.role)}>About</button>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 14 }}>
              <div style={{ fontSize: 12, color: "var(--edai-muted)", fontWeight: 700, whiteSpace: "nowrap" }}>Day {sprint.currentDay}/{sprint.timeline}</div>
              <div style={{ flex: 1, height: 8, background: "rgba(255,255,255,.07)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${(sprint.currentDay / sprint.timeline) * 100}%`, height: "100%", background: grad, borderRadius: 99 }} />
              </div>
              <div style={{ fontSize: 12, color, fontWeight: 700, whiteSpace: "nowrap" }}>
                {Math.round((sprint.currentDay / sprint.timeline) * 100)}% complete
              </div>
            </div>
          </>
        )}
      </div>

      {/* Body */}
      {sprint && (
        <div style={{ flex: 1, overflow: "auto", paddingTop: 20 }}>
          {isComplete ? (
            <div style={{ maxWidth: 520, margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🏁</div>
              <h2 style={{ fontFamily: "var(--ff-heading)", fontSize: 26, fontWeight: 700, color: "var(--edai-text)", margin: "0 0 10px" }}>Sprint complete.</h2>
              <p style={{ color: "var(--edai-muted)", fontSize: 15, marginBottom: 8 }}>You finished your {sprint.timeline}-day {sprint.roleName} sprint.</p>
              <button onClick={() => setView("roadmap")} className="ff-btn-accent" style={{ marginTop: 16, background: grad, color: "#fff", border: "none", borderRadius: 9, padding: "11px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "var(--ff-body)" }}>Review the full sprint →</button>
            </div>
          ) : view === "about" ? (
            <AboutPanel sprint={sprint} />
          ) : view === "today" && currentDay ? (
            <TodayPanel sprint={sprint} day={currentDay} onToggleTask={handleToggleTask} onOpenCheckin={() => setCheckinOpen(true)} />
          ) : (
            <Roadmap sprint={sprint} onPickDay={setPickedDay} />
          )}
        </div>
      )}

      {checkinOpen && currentDay && (
        <CheckinModal sprint={sprint} day={currentDay} onClose={() => setCheckinOpen(false)} onSubmit={handleCheckin} submitting={submitting} />
      )}
      {pickedDay && sprint && (
        <DayDetailModal sprint={sprint} day={pickedDay} onClose={() => setPickedDay(null)} />
      )}
    </div>
  );
}

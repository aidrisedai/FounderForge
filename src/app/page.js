"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { CURRICULUM, TOTAL_TASKS } from "@/lib/curriculum";
import PersonalityAssessment from "@/components/PersonalityAssessment";
import MemoryDashboard from "@/components/MemoryDashboard";
import UserProfile from "@/components/UserProfile";
import LeaderboardWidget from "@/components/LeaderboardWidget";
import AchievementNotification, { LevelUpNotification, XPNotification } from "@/components/AchievementNotification";
import { getPersonalitySummary, getPersonalizedEncouragement } from "@/lib/personality";
import PersonaSimulation from "@/components/PersonaSimulation";
import CommunityTab from "@/components/CommunityTab";
import DiscoveryModule from "@/components/DiscoveryModule";
import NinetyDayYC from "@/components/NinetyDayYC";
import ExpertHire from "@/components/ExpertHire";

// ── API helpers ──
async function apiGet(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("API error");
  return res.json();
}
async function apiPost(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("API error");
  return res.json();
}

// ── Components ──

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, padding: "14px 20px", alignItems: "center" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"rgba(255,255,255,.2)", animation:`ffBounce 1.4s ${i*.15}s infinite` }} />
      ))}
      <span style={{ fontSize:11, color:"rgba(255,255,255,.12)", marginLeft:8, fontFamily:"var(--ff-body)", fontWeight:600 }}>thinking...</span>
    </div>
  );
}

// Lightweight inline markdown: **bold**, *italic*, `code` (newlines preserved by pre-wrap)
function renderInlineMarkdown(text) {
  if (typeof text !== "string") return text;
  const parts = [];
  const regex = /(\*\*([^*]+)\*\*|\*([^*\n]+)\*|`([^`]+)`)/g;
  let last = 0, m, i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2] !== undefined) parts.push(<strong key={i} style={{ fontWeight: 700, color: "#fff" }}>{m[2]}</strong>);
    else if (m[3] !== undefined) parts.push(<em key={i}>{m[3]}</em>);
    else if (m[4] !== undefined) parts.push(<code key={i} style={{ fontFamily: "monospace", fontSize: "0.9em", background: "rgba(255,255,255,.08)", padding: "1px 5px", borderRadius: 4 }}>{m[4]}</code>);
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function getQuickReplies(task, messages) {
  if (!task) return [];
  const hasUserResponded = messages.some(m => m.role === "user");
  if (!hasUserResponded) {
    return ["I'm ready — let's go", "I have a question first"];
  }
  if (task.type === "simulation") {
    return ["Start the simulation", "Can you give me tips first?"];
  }
  const tid = task.id || "";
  if (tid.endsWith(".7") || tid.endsWith(".6") || tid.endsWith(".5")) {
    return ["Here's my draft", "What counts as complete?", "I need to revisit something"];
  }
  return ["Here's what I found", "Can you give me an example?", "I'm stuck — help me think through this"];
}

// ── Progress gating ──
// Tasks unlock strictly in order: the frontier step is the first step with
// unfinished tasks; within it, only tasks up to the next incomplete one are
// reachable. Everything past that is locked until the current task is done.
function frontierStepIdx(ct) {
  for (let i = 0; i < CURRICULUM.length; i++) {
    if ((ct[CURRICULUM[i].id] || 0) < CURRICULUM[i].tasks.length) return i;
  }
  return CURRICULUM.length - 1;
}

function isStepLocked(ct, si) {
  return si > frontierStepIdx(ct);
}

function isTaskLocked(ct, si, ti) {
  const f = frontierStepIdx(ct);
  if (si > f) return true;
  if (si < f) return false; // fully completed step — revisiting allowed
  return ti > (ct[CURRICULUM[si].id] || 0);
}

function ChatBubble({ role, content }) {
  const isBot = role === "assistant";
  return (
    <div style={{ display:"flex", gap:14, padding:"10px 0", flexDirection:isBot?"row":"row-reverse", alignItems:"flex-start", animation:"ffSlide .35s ease-out" }}>
      {isBot && (
        <div style={{ width:38, height:38, minWidth:38, borderRadius:12, background:"var(--ff-accent-grad)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, fontWeight:700, color:"#fff", fontFamily:"var(--ff-display)", boxShadow:"0 4px 18px rgba(31,166,122,.3)", marginTop:2, flexShrink:0 }}>F</div>
      )}
      <div style={{
        padding: isBot ? "16px 20px" : "13px 18px",
        borderRadius: 20,
        borderTopLeftRadius: isBot ? 5 : 20,
        borderTopRightRadius: isBot ? 20 : 5,
        background: isBot ? "rgba(255,255,255,.05)" : "rgba(31,166,122,.12)",
        border: `1px solid ${isBot ? "rgba(255,255,255,.08)" : "rgba(31,166,122,.22)"}`,
        fontSize: 14.5,
        lineHeight: 1.85,
        color: isBot ? "rgba(255,255,255,.88)" : "rgba(255,255,255,.92)",
        fontFamily: "var(--ff-body)",
        whiteSpace: "pre-wrap",
        maxWidth: "78%",
        letterSpacing: ".006em"
      }}>
        {renderInlineMarkdown(content)}
      </div>
    </div>
  );
}

function CompletedDeliverableCard({ step, task, deliverable, isDraft = false }) {
  if (!step || !task || !deliverable) return null;

  return (
    <div style={{ margin:"0 0 18px", padding:"18px 20px", borderRadius:18, background:`linear-gradient(135deg, ${step.color}14, rgba(255,255,255,.035))`, border:`1px solid ${step.color}30`, boxShadow:`0 14px 38px ${step.color}10` }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:14, marginBottom:14 }}>
        <div>
          <div style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"4px 10px", borderRadius:99, background:`${step.color}18`, border:`1px solid ${step.color}35`, marginBottom:10 }}>
            <span style={{ fontSize:12 }}>{isDraft ? "✍️" : "✅"}</span>
            <span style={{ fontSize:10, fontWeight:800, letterSpacing:".12em", color:step.color, fontFamily:"var(--ff-body)", textTransform:"uppercase" }}>{isDraft ? "Draft saved" : "Completed card"}</span>
          </div>
          <h3 style={{ fontSize:17, fontFamily:"var(--ff-display)", fontWeight:750, color:"rgba(255,255,255,.94)", margin:"0 0 4px", letterSpacing:"-.02em" }}>{task.title}</h3>
          <p style={{ fontSize:12.5, lineHeight:1.6, color:"rgba(255,255,255,.5)", fontFamily:"var(--ff-body)", margin:0 }}>{task.goal}</p>
        </div>
        <div style={{ width:40, height:40, borderRadius:12, background:`${step.color}18`, border:`1px solid ${step.color}35`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{step.icon}</div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:10, marginBottom:12 }}>
        <div style={{ padding:"11px 12px", borderRadius:12, background:"rgba(0,0,0,.16)", border:"1px solid rgba(255,255,255,.06)" }}>
          <div style={{ fontSize:9.5, fontWeight:800, letterSpacing:".14em", color:"rgba(255,255,255,.32)", fontFamily:"var(--ff-body)", textTransform:"uppercase", marginBottom:5 }}>What was done</div>
          <div style={{ fontSize:12.5, lineHeight:1.55, color:"rgba(255,255,255,.68)", fontFamily:"var(--ff-body)" }}>{task.title}</div>
        </div>
        <div style={{ padding:"11px 12px", borderRadius:12, background:"rgba(0,0,0,.16)", border:"1px solid rgba(255,255,255,.06)" }}>
          <div style={{ fontSize:9.5, fontWeight:800, letterSpacing:".14em", color:"rgba(255,255,255,.32)", fontFamily:"var(--ff-body)", textTransform:"uppercase", marginBottom:5 }}>Outcome</div>
          <div style={{ fontSize:12.5, lineHeight:1.55, color:"rgba(255,255,255,.68)", fontFamily:"var(--ff-body)" }}>{task.output}</div>
        </div>
      </div>

      <details open={isDraft} style={{ borderRadius:12, background:"rgba(255,255,255,.035)", border:"1px solid rgba(255,255,255,.07)", overflow:"hidden" }}>
        <summary style={{ padding:"11px 13px", cursor:"pointer", color:"rgba(255,255,255,.75)", fontSize:12, fontWeight:800, letterSpacing:".08em", textTransform:"uppercase", fontFamily:"var(--ff-body)" }}>
          View deliverable
        </summary>
        <div style={{ padding:"0 13px 13px", whiteSpace:"pre-wrap", color:"rgba(255,255,255,.72)", fontSize:13, lineHeight:1.7, fontFamily:"var(--ff-body)" }}>{deliverable}</div>
      </details>
    </div>
  );
}

function Timeline({ steps, project, activeStepId, activeTaskIdx, onNav }) {
  const ct = project.completedTasks || {};
  const done = Object.values(ct).reduce((a,v) => a+v, 0);
  const pct = TOTAL_TASKS ? Math.round(done/TOTAL_TASKS*100) : 0;

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"4px 0 8px" }}>
      {/* Compact progress */}
      <div style={{ margin:"0 12px 6px", padding:"10px 12px", borderRadius:10, background:"rgba(255,255,255,.022)", border:"1px solid rgba(255,255,255,.06)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:".14em", color:"rgba(255,255,255,.22)", fontFamily:"var(--ff-body)", textTransform:"uppercase" }}>Journey</span>
          <span style={{ fontSize:11.5, fontWeight:700, color:"var(--ff-accent)", fontFamily:"var(--ff-body)" }}>{pct}%</span>
        </div>
        <div style={{ height:3, borderRadius:99, background:"rgba(255,255,255,.06)", overflow:"hidden" }}>
          <div style={{ height:"100%", borderRadius:99, background:"var(--ff-accent-grad)", width:`${pct}%`, transition:"width .7s cubic-bezier(.4,0,.2,1)", boxShadow:pct>0?"0 0 8px rgba(31,166,122,.5)":"none" }} />
        </div>
        <div style={{ marginTop:5, fontSize:10, color:"rgba(255,255,255,.18)", fontFamily:"var(--ff-body)" }}>{done} of {TOTAL_TASKS} tasks</div>
      </div>

      {steps.map((s, si) => {
        const sd = ct[s.id] || 0;
        const isActive = s.id === activeStepId;
        const stepDone = sd >= s.tasks.length;
        const sLocked = isStepLocked(ct, si);

        return (
          <div key={s.id}>
            {/* Step row */}
            <div
              onClick={() => onNav(si, Math.min(sd, s.tasks.length-1))}
              className="ff-step-row"
              style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 14px", cursor:"pointer", position:"relative", background:isActive?"rgba(255,255,255,.028)":"transparent", transition:"background .15s", opacity:sLocked?.55:1 }}
            >
              {/* Left accent bar */}
              <div style={{ position:"absolute", left:0, top:"50%", transform:"translateY(-50%)", width:2.5, height:isActive?26:0, borderRadius:99, background:s.color, transition:"height .3s cubic-bezier(.4,0,.2,1)", boxShadow:isActive?`0 0 10px ${s.color}55`:"none" }} />

              {/* Icon bubble */}
              <div style={{ width:30, height:30, minWidth:30, borderRadius:9, background:stepDone?`${s.color}22`:isActive?`${s.color}18`:"rgba(255,255,255,.04)", border:`1.5px solid ${stepDone||isActive?s.color+"45":"rgba(255,255,255,.07)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, transition:"all .2s", flexShrink:0 }}>
                {stepDone ? <span style={{ fontSize:12, color:s.color }}>✓</span> : sLocked ? <span style={{ fontSize:11, opacity:.7 }}>🔒</span> : s.icon}
              </div>

              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:isActive?600:400, color:isActive?s.color:stepDone?"rgba(255,255,255,.45)":"rgba(255,255,255,.28)", fontFamily:"var(--ff-body)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", letterSpacing:"-.005em" }}>
                  {s.title}
                </div>
                <div style={{ fontSize:9.5, color:"rgba(255,255,255,.18)", fontFamily:"var(--ff-body)", marginTop:1 }}>{sLocked ? "Locked" : `${sd}/${s.tasks.length} tasks`}</div>
              </div>
            </div>

            {/* Tasks — only show for active or started steps */}
            {(isActive || sd > 0) && (
              <div style={{ padding:"2px 14px 4px 42px" }}>
                {s.tasks.map((t, ti) => {
                  const tdone = ti < sd;
                  const curr = isActive && ti === activeTaskIdx;
                  const tLocked = isTaskLocked(ct, si, ti);
                  return (
                    <div
                      key={t.id}
                      onClick={() => onNav(si, ti)}
                      className="ff-task-row"
                      style={{ display:"flex", alignItems:"center", gap:9, padding:"4px 8px", borderRadius:7, cursor:"pointer", transition:"background .12s", marginBottom:1, opacity:tLocked?.5:1 }}
                    >
                      {/* Task dot */}
                      <div style={{ width:8, height:8, minWidth:8, borderRadius:"50%", background:tdone?s.color:curr?"transparent":"rgba(255,255,255,.1)", border:curr?`2px solid ${s.color}`:tdone?"none":"1.5px solid rgba(255,255,255,.12)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:curr?`0 0 7px ${s.color}90`:"none", animation:curr?"ffPulse 2.2s infinite":"none", flexShrink:0, transition:"all .2s" }}>
                        {curr && <div style={{ width:3, height:3, borderRadius:"50%", background:s.color }} />}
                      </div>
                      <span style={{ fontSize:12, color:tdone?"rgba(255,255,255,.38)":curr?"rgba(255,255,255,.9)":"rgba(255,255,255,.3)", fontFamily:"var(--ff-body)", fontWeight:curr?600:400, lineHeight:1.3, flex:1, minWidth:0 }}>
                        {t.title}
                      </span>
                      {tLocked && <span style={{ fontSize:9, opacity:.5, flexShrink:0 }}>🔒</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Embedded browser detection ──
function useIsEmbeddedBrowser() {
  const [embedded, setEmbedded] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isEmbedded =
      /FBAN|FBAV|Instagram|LinkedInApp|Twitter|Snapchat|TikTok|Pinterest|Line\/|MicroMessenger|GSA\//.test(ua) ||
      (/iPhone|iPad|iPod/.test(ua) && !/Safari\//.test(ua) && /AppleWebKit/.test(ua)) ||
      /\bwv\b/.test(ua);
    setEmbedded(isEmbedded);
  }, []);
  return embedded;
}

// ── Landing Page ──
function LandingPage() {
  const [vis, setVis] = useState(false);
  const isEmbedded = useIsEmbeddedBrowser();
  useEffect(() => { const t = setTimeout(() => setVis(true), 80); return () => clearTimeout(t); }, []);

  const fade = (delay = 0) => ({
    opacity: vis ? 1 : 0,
    transform: vis ? "translateY(0)" : "translateY(26px)",
    transition: `opacity 0.75s ease ${delay}s, transform 0.75s ease ${delay}s`,
  });

  const steps = [
    { icon: "🔍", label: "Discover", desc: "Validate a real problem" },
    { icon: "✏️", label: "Define", desc: "Design what they'll pay for" },
    { icon: "🛠️", label: "Build", desc: "Ship the simplest thing" },
    { icon: "🚀", label: "First Sale", desc: "Get someone to pay you" },
  ];

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", background:"var(--edai-bg)", position:"relative", overflow:"hidden" }}>
      {/* Background orbs */}
      <div style={{ position:"absolute", top:"-15%", right:"-8%", width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle,rgba(31,166,122,.09) 0%,transparent 65%)", pointerEvents:"none", animation:"ffFloat 14s ease-in-out infinite" }} />
      <div style={{ position:"absolute", bottom:"-20%", left:"-5%", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(0,102,204,.07) 0%,transparent 65%)", pointerEvents:"none", animation:"ffFloat 18s ease-in-out infinite reverse" }} />
      <div style={{ position:"absolute", inset:0, opacity:.015, backgroundImage:"radial-gradient(rgba(255,255,255,.9) 1px,transparent 1px)", backgroundSize:"26px 26px", pointerEvents:"none" }} />

      {/* Nav */}
      <nav style={{ padding:"22px 48px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative", zIndex:10, flexShrink:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:"var(--ff-accent-grad)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:800, color:"#fff", fontFamily:"var(--ff-display)", boxShadow:"0 4px 20px rgba(31,166,122,.35)", animation:"ffGlow 4s ease-in-out infinite" }}>F</div>
          <span style={{ fontSize:19, fontFamily:"var(--ff-display)", fontWeight:700, letterSpacing:"-.02em", color:"var(--edai-text)" }}>FounderForge</span>
        </div>
        <button
          onClick={() => signIn("google")}
          style={{ padding:"9px 22px", borderRadius:99, border:"1px solid rgba(255,255,255,.14)", background:"transparent", color:"rgba(255,255,255,.65)", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"var(--ff-body)", transition:"border-color .2s, color .2s" }}
          onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.35)"; e.currentTarget.style.color = "#fff"; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,.14)"; e.currentTarget.style.color = "rgba(255,255,255,.65)"; }}
        >
          Sign in
        </button>
      </nav>

      {/* Embedded browser warning */}
      {isEmbedded && (
        <div style={{ margin:"0 24px", padding:"16px 20px", borderRadius:14, background:"rgba(255,180,0,.08)", border:"1px solid rgba(255,180,0,.25)", display:"flex", alignItems:"flex-start", gap:14, position:"relative", zIndex:10 }}>
          <span style={{ fontSize:22, flexShrink:0, lineHeight:1 }}>⚠️</span>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:"rgba(255,200,0,.9)", fontFamily:"var(--ff-body)", marginBottom:5 }}>
              Open in your browser to sign in
            </div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,.45)", fontFamily:"var(--ff-body)", lineHeight:1.55 }}>
              Google sign-in doesn&apos;t work inside apps. Copy the link and open it in <strong style={{ color:"rgba(255,255,255,.65)" }}>Safari</strong> or <strong style={{ color:"rgba(255,255,255,.65)" }}>Chrome</strong> to continue.
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"48px 24px 60px", position:"relative", zIndex:1, textAlign:"center" }}>
        <div style={{ ...fade(0.05), marginBottom:20 }}>
          <span style={{ fontSize:11, fontWeight:700, letterSpacing:".28em", color:"var(--ff-accent)", fontFamily:"var(--ff-body)", textTransform:"uppercase" }}>AI Startup Mentor</span>
        </div>

        <h1 style={{ ...fade(0.15), fontSize:"clamp(44px,6.5vw,86px)", fontFamily:"var(--ff-display)", fontWeight:700, lineHeight:1.04, letterSpacing:"-.035em", margin:"0 0 24px", maxWidth:860 }}>
          Build something<br />
          <em style={{ color:"var(--ff-accent)", fontStyle:"italic" }}>the world needs.</em>
        </h1>

        <p style={{ ...fade(0.28), fontSize:18, lineHeight:1.72, color:"rgba(255,255,255,.45)", maxWidth:480, margin:"0 auto 52px", fontFamily:"var(--ff-body)" }}>
          From raw idea to your first paying customer — one focused task at a time, with an AI mentor guiding every step.
        </p>

        {/* 4-step journey */}
        <div style={{ ...fade(0.38), display:"flex", alignItems:"flex-start", gap:0, width:"100%", maxWidth:720, margin:"0 auto 52px", position:"relative" }}>
          {steps.map((s, i) => (
            <div key={s.label} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", position:"relative" }}>
              {/* connector line */}
              {i < steps.length - 1 && (
                <div style={{ position:"absolute", top:22, left:"50%", width:"100%", height:1, background:"linear-gradient(90deg,rgba(31,166,122,.4),rgba(31,166,122,.1))", zIndex:0 }} />
              )}
              <div style={{ width:44, height:44, borderRadius:14, background:"rgba(31,166,122,.1)", border:"1px solid rgba(31,166,122,.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, marginBottom:12, position:"relative", zIndex:1, backdropFilter:"blur(8px)" }}>
                {s.icon}
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,.82)", fontFamily:"var(--ff-body)", marginBottom:4, textAlign:"center" }}>{s.label}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,.28)", fontFamily:"var(--ff-body)", textAlign:"center", lineHeight:1.45, padding:"0 8px" }}>{s.desc}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ ...fade(0.72), display:"flex", flexDirection:"column", alignItems:"center", gap:14 }}>
          <button
            onClick={() => signIn("google")}
            className="ff-btn-accent"
            style={{ padding:"17px 44px", borderRadius:99, border:"none", background:"var(--ff-accent-grad)", color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"var(--ff-body)", boxShadow:"0 8px 40px rgba(31,166,122,.38)", letterSpacing:".01em" }}
          >
            Begin Your Journey →
          </button>
          <span style={{ fontSize:12, color:"rgba(255,255,255,.2)", fontFamily:"var(--ff-body)" }}>Free to start · No credit card required</span>
        </div>
      </div>
    </div>
  );
}

// ── Mode Selection ──
function ModeSelection({ session, onChoose }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), 80); return () => clearTimeout(t); }, []);

  const fade = (delay = 0) => ({
    opacity: vis ? 1 : 0,
    transform: vis ? "translateY(0)" : "translateY(24px)",
    transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
  });

  const modes = [
    {
      id: "journey",
      icon: "✦",
      label: "The Founder Journey",
      sub: "7 steps · idea to first sale",
      desc: "Start with problem discovery and move through validation, building, and deployment — one focused task at a time with your AI mentor guiding every step.",
      points: ["Problem & market validation", "MVP build & user testing", "First revenue milestones"],
      color: "31,166,122",
      grad: "linear-gradient(135deg,#1FA67A,#0E8A63)",
    },
    {
      id: "yc",
      icon: "◈",
      label: "90 Days at YC",
      sub: "Your timeline · $1M path",
      desc: "The playbook Y Combinator gives their best companies, on your timeline — 30, 60, 90 days or your own. Shape the plan with your coach, then execute with daily check-ins.",
      points: ["Pick your sprint length", "Refine the plan before Day 1", "Daily YC-style check-ins"],
      color: "255,102,0",
      grad: "linear-gradient(135deg,#FF6600,#FF8534)",
    },
  ];

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 24px", position:"relative", overflow:"hidden", background:"var(--edai-bg)" }}>
      <div style={{ position:"absolute", inset:0, opacity:.016, backgroundImage:"radial-gradient(rgba(255,255,255,.85) 1px,transparent 1px)", backgroundSize:"26px 26px", pointerEvents:"none" }} />
      <div style={{ position:"absolute", top:"-20%", right:"-5%", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(31,166,122,.07),transparent 65%)", pointerEvents:"none" }} />

      <div style={{ ...fade(0), textAlign:"center", marginBottom:52, position:"relative", zIndex:1 }}>
        <p style={{ fontSize:13, color:"var(--ff-accent)", fontFamily:"var(--ff-body)", fontWeight:600, marginBottom:10 }}>
          Welcome, {session?.user?.name?.split(" ")[0] || "Founder"} 👋
        </p>
        <h1 style={{ fontSize:"clamp(34px,5vw,58px)", fontFamily:"var(--ff-display)", fontWeight:700, letterSpacing:"-.03em", lineHeight:1.08, margin:"0 0 16px" }}>
          How do you want<br />to build?
        </h1>
        <p style={{ fontSize:15, color:"rgba(255,255,255,.4)", fontFamily:"var(--ff-body)", maxWidth:400, margin:"0 auto", lineHeight:1.65 }}>
          Choose your path. You can switch anytime, and the founder community is available on both.
        </p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:20, maxWidth:700, width:"100%", position:"relative", zIndex:1 }}>
        {modes.map((m, i) => (
          <button
            key={m.id}
            onClick={() => onChoose(m.id)}
            style={{
              ...fade(0.18 + i * 0.12),
              padding:"34px 30px",
              borderRadius:22,
              border:`1px solid rgba(${m.color},.22)`,
              background:`rgba(${m.color},.06)`,
              textAlign:"left",
              cursor:"pointer",
              display:"flex",
              flexDirection:"column",
              backdropFilter:"blur(8px)",
              transition:"border-color .2s, background .2s, transform .2s",
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = `rgba(${m.color},.45)`; e.currentTarget.style.background = `rgba(${m.color},.1)`; e.currentTarget.style.transform = "translateY(-3px)"; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = `rgba(${m.color},.22)`; e.currentTarget.style.background = `rgba(${m.color},.06)`; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ fontSize:26, fontFamily:"var(--ff-display)", color:`rgb(${m.color})`, marginBottom:16 }}>{m.icon}</div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:".22em", color:`rgb(${m.color})`, fontFamily:"var(--ff-body)", textTransform:"uppercase", marginBottom:6 }}>{m.sub}</div>
            <div style={{ fontSize:22, fontFamily:"var(--ff-display)", fontWeight:700, color:"rgba(255,255,255,.95)", marginBottom:12, lineHeight:1.18 }}>{m.label}</div>
            <div style={{ fontSize:13, lineHeight:1.72, color:"rgba(255,255,255,.42)", fontFamily:"var(--ff-body)", marginBottom:22 }}>{m.desc}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:7, marginBottom:26 }}>
              {m.points.map(pt => (
                <div key={pt} style={{ display:"flex", alignItems:"center", gap:9, fontSize:12, color:"rgba(255,255,255,.5)", fontFamily:"var(--ff-body)" }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:`rgb(${m.color})`, flexShrink:0 }} />
                  {pt}
                </div>
              ))}
            </div>
            <div style={{ marginTop:"auto", padding:"11px 0", borderRadius:99, background:m.grad, color:"#fff", fontSize:13, fontWeight:700, fontFamily:"var(--ff-body)", textAlign:"center", letterSpacing:".01em" }}>
              Choose This Path →
            </div>
          </button>
        ))}
      </div>

      <div style={{ ...fade(0.5), marginTop:32, display:"flex", alignItems:"center", gap:8, fontSize:12.5, color:"rgba(255,255,255,.22)", fontFamily:"var(--ff-body)", position:"relative", zIndex:1 }}>
        <span style={{ fontSize:14 }}>🤝</span>
        Founder Community is included on both paths
      </div>
    </div>
  );
}

// ── MAIN APP ──
export default function Home() {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [taskIdx, setTaskIdx] = useState(0);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [newName, setNewName] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [personality, setPersonality] = useState(null);
  const [showPersonality, setShowPersonality] = useState(false);
  const [personalityChecked, setPersonalityChecked] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [taskStartTime, setTaskStartTime] = useState(null);
  const [showSidebarNewProject, setShowSidebarNewProject] = useState(false);
  const [sidebarProjectName, setSidebarProjectName] = useState("");
  const [importBanner, setImportBanner] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [showYC, setShowYC] = useState(false);
  const [showExpert, setShowExpert] = useState(false);
  const [appMode, setAppMode] = useState(() => {
    if (typeof window === "undefined") return null;
    try { return localStorage.getItem("ff_mode") || null; } catch { return null; }
  });
  const [sharePrompt, setSharePrompt] = useState(null); // {body, milestone, taskId, stepId}
  const [lockedInfo, setLockedInfo] = useState(null); // {step, task|null} — preview of a locked step/task
  const btmRef = useRef(null);
  const needsInitRef = useRef(false);

  const project = projects.find(p => p.id === activeId) || null;
  const step = CURRICULUM[stepIdx];
  const task = step?.tasks[taskIdx];

  const scroll = useCallback(() => setTimeout(() => btmRef.current?.scrollIntoView({ behavior:"smooth" }), 100), []);

  // Load user data and personality
  useEffect(() => {
    if (status === "authenticated") {
      // Load projects, then check for guest session to import
      apiGet("/api/projects").then(data => {
        const projs = data.projects || [];

        let guestImport = null;
        try {
          const raw = localStorage.getItem("ff_guest_session");
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.messages?.length > 0) guestImport = parsed;
            localStorage.removeItem("ff_guest_session");
          }
        } catch (_) {}

        if (guestImport) {
          const gp = {
            id: "p_" + Date.now(),
            name: "My Startup Idea",
            completedTasks: guestImport.deliverable ? { 1: 1 } : {},
            deliverables: guestImport.deliverable ? { "1.1": guestImport.deliverable } : {},
            taskMessages: { "1.1": guestImport.messages },
          };
          const merged = [gp, ...projs];
          setProjects(merged);
          setActiveId(gp.id);
          setImportBanner(true);
          setTimeout(() => setImportBanner(false), 5000);
        } else {
          setProjects(projs);
          if (projs.length > 0) setActiveId(projs[0].id);
        }

        setDataLoaded(true);
      }).catch(() => setDataLoaded(true));
      
      // Load personality profile
      apiGet("/api/personality").then(data => {
        if (data.personality) {
          setPersonality(data.personality);
        }
        setPersonalityChecked(true);
      }).catch(() => setPersonalityChecked(true));
    }
  }, [status]);

  // Save on change
  useEffect(() => {
    if (dataLoaded && status === "authenticated") {
      apiPost("/api/projects", { projects }).catch(console.error);
    }
  }, [projects, dataLoaded]);

  // Go to frontier when project changes
  useEffect(() => {
    if (!project) return;
    const ct = project.completedTasks || {};
    for (let si = 0; si < CURRICULUM.length; si++) {
      const s = CURRICULUM[si];
      if ((ct[s.id] || 0) < s.tasks.length) { setStepIdx(si); setTaskIdx(ct[s.id] || 0); return; }
    }
    setStepIdx(CURRICULUM.length - 1);
    setTaskIdx(CURRICULUM[CURRICULUM.length - 1].tasks.length - 1);
  }, [activeId]);

  // Load messages when task changes
  useEffect(() => {
    if (!project || !task) return;
    const saved = (project.taskMessages || {})[task.id] || [];
    setMessages(saved);
    needsInitRef.current = saved.length === 0;
    // Set task start time for gamification
    if (saved.length === 0) {
      setTaskStartTime(Date.now());
    }
  }, [activeId, stepIdx, taskIdx]);

  // Init new task
  useEffect(() => {
    if (needsInitRef.current && !loading && project && task) {
      needsInitRef.current = false;
      callMentor(null, true);
    }
  }, [messages, loading, project, task]);

  useEffect(() => { scroll(); }, [messages, banner]);

  function updateProject(id, fn) {
    setProjects(prev => prev.map(p => p.id === id ? fn(p) : p));
  }

  function saveMsgs(tid, msgs) {
    if (!activeId) return;
    updateProject(activeId, p => ({ ...p, taskMessages: { ...(p.taskMessages||{}), [tid]: msgs } }));
  }

  async function callMentor(userText, isInit) {
    if (!project || !step || !task) return;
    const existingDel = (project.deliverables || {})[task.id];

    let apiMsgs;
    if (isInit) {
      apiMsgs = [{ role: "user", content: existingDel ? `Revisiting. Previous: "${existingDel}". May update.` : "Ready. Guide me." }];
    } else {
      apiMsgs = [...messages.filter(m => m.role === "user" || m.role === "assistant"), { role: "user", content: userText }];
    }

    let displayMsgs = isInit ? [] : [...messages, { role: "user", content: userText }];
    if (!isInit) { setMessages(displayMsgs); saveMsgs(task.id, displayMsgs); }
    setLoading(true); scroll();

    try {
      const data = await apiPost("/api/chat", { 
        messages: apiMsgs, 
        stepId: step.id, 
        taskIdx, 
        project,
        personality,  // Include personality in API call
        taskStartTime: taskStartTime || Date.now()
      });
      const raw = (data.content || []).map(c => c.text || "").join("") || "Let me try again...";

      const delMatch = raw.match(/\[DELIVERABLE_START\]([\s\S]*?)\[DELIVERABLE_END\]/);
      const isComplete = raw.includes("[TASK_COMPLETE]");
      const clean = raw.replace(/\[DELIVERABLE_START\][\s\S]*?\[DELIVERABLE_END\]/g, "").replace(/\[TASK_COMPLETE\]/g, "").trim();

      const final = [...displayMsgs, { role: "assistant", content: clean }];
      setMessages(final); saveMsgs(task.id, final);

      if (isComplete && delMatch) {
        const delText = delMatch[1].trim();
        updateProject(activeId, p => {
          const nd = { ...(p.deliverables||{}), [task.id]: delText };
          const nc = { ...(p.completedTasks||{}) };
          nc[step.id] = Math.max(nc[step.id]||0, taskIdx+1);
          return { ...p, deliverables: nd, completedTasks: nc };
        });
        setBanner(task.title);

        // Offer opt-in share to community feed after a short delay
        setTimeout(() => {
          setSharePrompt({
            body: `Just completed "${task.title}" 🎉 ${task.goal ? `\n\n${task.goal}` : ""}`.trim(),
            milestone: `Completed: ${task.title}`,
            taskId: task.id,
            stepId: step.id,
          });
        }, 1500);

        // Handle gamification data
        if (data.gamification) {
          const { xpEarned, leveledUp, newLevel, achievements } = data.gamification;
          
          // Show XP notification
          if (xpEarned) {
            setNotifications(prev => [...prev, {
              type: 'xp',
              data: { xpEarned, reason: `Completed: ${task.title}` },
              id: Date.now()
            }]);
          }
          
          // Show level up notification
          if (leveledUp && newLevel) {
            setTimeout(() => {
              setNotifications(prev => [...prev, {
                type: 'levelup',
                data: { newLevel },
                id: Date.now() + 1
              }]);
            }, 500);
          }
          
          // Show achievement notifications
          if (achievements && achievements.length > 0) {
            achievements.forEach((ach, idx) => {
              setTimeout(() => {
                setNotifications(prev => [...prev, {
                  type: 'achievement',
                  data: { 
                    achievement: ach.achievement,
                    xpEarned: ach.achievement.xpReward
                  },
                  id: Date.now() + 100 + idx
                }]);
              }, 1000 + (idx * 1500));
            });
          }
        }
        
        // Reset task start time for next task
        setTaskStartTime(null);
        
        setTimeout(() => setBanner(null), 2200);
      }
    } catch (e) {
      const err = [...displayMsgs, { role: "assistant", content: "Connection issue — try again." }];
      setMessages(err); saveMsgs(task.id, err);
    }
    setLoading(false); scroll();
  }

  function goToNextTask() {
    if (!step || !task) return;
    if (taskIdx < step.tasks.length-1) {
      setTaskIdx(taskIdx+1);
      setTaskStartTime(Date.now());
    } else if (stepIdx < CURRICULUM.length-1) {
      setStepIdx(stepIdx+1);
      setTaskIdx(0);
      setTaskStartTime(Date.now());
    }
  }

  function handleSend() {
    if (!input.trim() || loading || activeTaskIsComplete) return;
    const t = input.trim();
    setInput("");
    callMentor(t, false);
  }

  function handleSimulationComplete(deliverableText) {
    updateProject(activeId, p => {
      const nd = { ...(p.deliverables||{}), [task.id]: deliverableText };
      const nc = { ...(p.completedTasks||{}) };
      nc[step.id] = Math.max(nc[step.id]||0, taskIdx+1);
      return { ...p, deliverables: nd, completedTasks: nc };
    });
    setTimeout(() => {
      if (taskIdx < step.tasks.length-1) {
        setTaskIdx(taskIdx+1);
        setTaskStartTime(Date.now());
      } else if (stepIdx < CURRICULUM.length-1) {
        setStepIdx(stepIdx+1);
        setTaskIdx(0);
        setTaskStartTime(Date.now());
      }
    }, 400);
  }

  function createProject(name) {
    const p = { id: "p_" + Date.now(), name, completedTasks: {}, deliverables: {}, taskMessages: {} };
    setProjects(prev => [...prev, p]);
    setActiveId(p.id);
  }

  // Auth states
  if (status === "loading") return <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}><TypingDots /></div>;
  if (status === "unauthenticated") return <LandingPage />;
  if (!dataLoaded) return <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}><TypingDots /></div>;

  const isRevisiting = project && task && (project.completedTasks?.[step?.id]||0) > taskIdx;
  const activeDeliverable = project && task ? (project.deliverables || {})[task.id] : null;
  const activeDeliverableIsDraft = Boolean(activeDeliverable && !isRevisiting);

  // Show personality assessment for first-time users (no personality and checked)
  if (!project && personalityChecked && !personality && !showPersonality) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:32, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, opacity:.02, backgroundImage:"radial-gradient(rgba(255,255,255,.7) 1px,transparent 1px)", backgroundSize:"28px 28px" }} />
        <div style={{ textAlign:"center", maxWidth:520, position:"relative", zIndex:1 }}>
          <div style={{ width:60, height:60, borderRadius:16, margin:"0 auto 24px", background:"var(--ff-accent-grad)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, color:"#fff", fontFamily:"var(--ff-heading)", boxShadow:"0 8px 40px rgba(31,166,122,.3)" }}>F</div>
          <p style={{ fontSize:13, color:"rgba(255,255,255,.35)", marginBottom:8 }}>Welcome, {session.user.name}</p>
          <h1 style={{ fontSize:32, fontFamily:"var(--ff-heading)", margin:"0 0 16px" }}>Personalize your experience</h1>
          <p style={{ fontSize:14, lineHeight:1.7, color:"rgba(255,255,255,.45)", margin:"0 auto 32px", maxWidth:420 }}>
            Take a quick 2-minute assessment to help me understand your work style, experience, and goals. 
            I'll use this to personalize examples, adjust pacing, and speak your language throughout your journey.
          </p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexDirection:"column", alignItems:"center" }}>
            <button 
              onClick={() => setShowPersonality(true)} 
              style={{ 
                padding:"14px 36px", 
                borderRadius:10, 
                border:"none", 
                background:"var(--ff-accent-grad)", 
                color:"#fff", 
                fontSize:13, 
                fontWeight:700, 
                cursor:"pointer", 
                fontFamily:"var(--ff-body)", 
                boxShadow:"0 4px 30px rgba(31,166,122,.3)" 
              }}
            >
              Personalize My Journey →
            </button>
            <button 
              onClick={() => setShowPersonality(false)} 
              style={{ 
                padding:"10px 20px", 
                borderRadius:8, 
                border:"1px solid rgba(255,255,255,.08)", 
                background:"transparent", 
                color:"rgba(255,255,255,.35)", 
                fontSize:12, 
                fontWeight:600, 
                cursor:"pointer", 
                fontFamily:"var(--ff-body)" 
              }}
            >
              Skip for now
            </button>
          </div>
          <div style={{ marginTop:32, display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
            {["🎯 Tailored examples", "⚡ Adaptive pacing", "💬 Your communication style"].map(benefit => (
              <span key={benefit} style={{ fontSize:11, padding:"4px 10px", borderRadius:6, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.04)", color:"rgba(255,255,255,.25)", fontFamily:"var(--ff-body)" }}>
                {benefit}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show personality assessment flow
  if (showPersonality && !personality) {
    return (
      <div style={{ minHeight:"100vh", background:"#0A0A0B", color:"#fff" }}>
        <PersonalityAssessment 
          onComplete={(p) => {
            setPersonality(p);
            setShowPersonality(false);
          }}
          onSkip={() => setShowPersonality(false)}
        />
      </div>
    );
  }

  // Mode selection (first-time chooser)
  function chooseMode(mode) {
    setAppMode(mode);
    try { localStorage.setItem("ff_mode", mode); } catch {}
    if (mode === "yc") setShowYC(true);
  }

  if (personalityChecked && !appMode) {
    return <ModeSelection session={session} onChoose={chooseMode} />;
  }

  // No projects yet (after personality or skip)
  // In YC mode — skip project creation, go straight to YC program
  if (!project && appMode === "yc") {
    return (
      <div style={{ height:"100vh", display:"flex" }}>
        <div style={{ width:256, minWidth:256, height:"100vh", background:"rgba(255,255,255,.012)", borderRight:"1px solid rgba(255,255,255,.05)", display:"flex", flexDirection:"column", padding:"16px 12px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:16 }}>
            <div style={{ width:30, height:30, borderRadius:9, background:"var(--ff-accent-grad)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"#fff", fontFamily:"var(--ff-display)" }}>F</div>
            <span style={{ fontSize:17, fontFamily:"var(--ff-display)", fontWeight:700, letterSpacing:"-.02em" }}>FounderForge</span>
          </div>
          <div style={{ padding:"6px 8px", borderRadius:8, background:"rgba(255,102,0,.08)", border:"1px solid rgba(255,102,0,.2)", marginBottom:12 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:".18em", color:"#FF8534", fontFamily:"var(--ff-body)", textTransform:"uppercase", marginBottom:2 }}>Active path</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,.75)", fontFamily:"var(--ff-body)", fontWeight:600 }}>🚀 90 Days at YC</div>
          </div>
          <button onClick={() => { setAppMode(null); try { localStorage.removeItem("ff_mode"); } catch {} }} style={{ fontSize:11, color:"rgba(255,255,255,.25)", background:"none", border:"1px solid rgba(255,255,255,.07)", borderRadius:6, padding:"5px 10px", cursor:"pointer", fontFamily:"var(--ff-body)", marginBottom:"auto" }}>Switch path</button>
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:8 }}>
            <button onClick={() => { setShowExpert(e => !e); setShowCommunity(false); }} style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1px solid ${showExpert?"rgba(139,92,246,.35)":"rgba(139,92,246,.18)"}`, background:showExpert?"rgba(139,92,246,.1)":"transparent", color:showExpert?"#A78BFA":"rgba(160,130,255,.6)", fontSize:12.5, fontWeight:600, cursor:"pointer", fontFamily:"var(--ff-body)", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:14 }}>🎯</span> Expert Hire
            </button>
            <button onClick={() => { setShowCommunity(c => !c); setShowExpert(false); }} style={{ width:"100%", padding:"9px 12px", borderRadius:9, border:`1px solid ${showCommunity?"rgba(99,102,241,.35)":"rgba(99,102,241,.18)"}`, background:showCommunity?"rgba(99,102,241,.08)":"transparent", color:showCommunity?"rgba(170,170,255,.9)":"rgba(160,160,255,.6)", fontSize:12.5, fontWeight:600, cursor:"pointer", fontFamily:"var(--ff-body)", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:14 }}>🤝</span> Community
            </button>
          </div>
        </div>
        <div style={{ flex:1, height:"100vh", overflow:"hidden" }}>
          {showCommunity ? (
            <CommunityTab session={session} sharePrompt={null} onShareDone={() => {}} />
          ) : showExpert ? (
            <ExpertHire />
          ) : (
            <NinetyDayYC />
          )}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:32, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, opacity:.02, backgroundImage:"radial-gradient(rgba(255,255,255,.7) 1px,transparent 1px)", backgroundSize:"28px 28px" }} />
        <div style={{ textAlign:"center", maxWidth:460, position:"relative", zIndex:1 }}>
          <div style={{ width:60, height:60, borderRadius:16, margin:"0 auto 24px", background:"var(--ff-accent-grad)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, color:"#fff", fontFamily:"var(--ff-display)", boxShadow:"0 8px 40px rgba(31,166,122,.3)" }}>F</div>
          <p style={{ fontSize:13, color:"rgba(255,255,255,.35)", marginBottom:4 }}>Welcome, {session.user.name}</p>
          {personality && (
            <p style={{ fontSize:10, color:"rgba(31,166,122,.6)", marginBottom:12, fontFamily:"var(--ff-body)", fontWeight:600 }}>
              {getPersonalitySummary(personality)}
            </p>
          )}
          <h1 style={{ fontSize:34, fontFamily:"var(--ff-display)", fontWeight:700, letterSpacing:"-.025em", margin:"0 0 24px", lineHeight:1.1 }}>Name your startup idea</h1>
          {showNewForm ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
              <input value={newName} onChange={e => setNewName(e.target.value)} autoFocus
                onKeyDown={e => { if (e.key==="Enter" && newName.trim()) { createProject(newName.trim()); setNewName(""); setShowNewForm(false); } }}
                placeholder="Name your startup idea..."
                style={{ width:280, padding:"12px 18px", borderRadius:10, textAlign:"center", border:"1px solid rgba(255,255,255,.15)", background:"rgba(255,255,255,.04)", color:"#fff", fontSize:14, outline:"none", fontFamily:"var(--ff-body)" }} />
              <button onClick={() => { if (newName.trim()) { createProject(newName.trim()); setNewName(""); setShowNewForm(false); } }} disabled={!newName.trim()}
                style={{ padding:"10px 28px", borderRadius:8, border:"none", background:newName.trim()?"var(--ff-accent-grad)":"rgba(255,255,255,.05)", color:newName.trim()?"#fff":"rgba(255,255,255,.2)", fontSize:12, fontWeight:700, cursor:newName.trim()?"pointer":"not-allowed", fontFamily:"var(--ff-body)", fontWeight:600 }}>BEGIN →</button>
            </div>
          ) : (
            <button onClick={() => setShowNewForm(true)} style={{ padding:"14px 36px", borderRadius:10, border:"none", background:"var(--ff-accent-grad)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"var(--ff-body)", fontWeight:600, boxShadow:"0 4px 30px rgba(31,166,122,.3)" }}>NEW PROJECT →</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height:"100vh", display:"flex" }}>
      {/* ── Sidebar ── */}
      <div style={{ width:252, minWidth:252, height:"100vh", background:"rgba(13,26,23,0.95)", borderRight:"1px solid rgba(255,255,255,.055)", display:"flex", flexDirection:"column" }}>

        {/* Sidebar header */}
        <div style={{ padding:"16px 14px 12px", flexShrink:0 }}>
          {/* Logo */}
          <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:14 }}>
            <div style={{ width:32, height:32, minWidth:32, borderRadius:9, background:"var(--ff-accent-grad)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, color:"#fff", fontFamily:"var(--ff-display)", boxShadow:"0 3px 14px rgba(31,166,122,.32)" }}>F</div>
            <span style={{ fontSize:16, fontFamily:"var(--ff-display)", fontWeight:700, letterSpacing:"-.02em", color:"var(--edai-text)" }}>FounderForge</span>
          </div>

          {/* Mode chip */}
          {appMode && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, padding:"6px 10px", borderRadius:8, background:appMode==="yc"?"rgba(255,102,0,.07)":"rgba(31,166,122,.07)", border:`1px solid ${appMode==="yc"?"rgba(255,102,0,.2)":"rgba(31,166,122,.2)"}` }}>
              <span style={{ fontSize:11.5, color:appMode==="yc"?"#FF8534":"var(--ff-accent)", fontFamily:"var(--ff-body)", fontWeight:600 }}>
                {appMode==="yc"?"🚀 90 Days at YC":"🛤 The Journey"}
              </span>
              <button onClick={() => { setAppMode(null); try { localStorage.removeItem("ff_mode"); } catch {} }}
                style={{ fontSize:9.5, color:"rgba(255,255,255,.2)", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--ff-body)", padding:"2px 0" }}>
                switch
              </button>
            </div>
          )}

          {/* Projects label */}
          <div style={{ fontSize:9.5, fontWeight:700, letterSpacing:".18em", color:"rgba(255,255,255,.2)", fontFamily:"var(--ff-body)", textTransform:"uppercase", marginBottom:5, paddingLeft:1 }}>Projects</div>

          {/* Project list */}
          {projects.map(p => {
            const active = p.id === activeId;
            return (
              <div key={p.id}
                onClick={() => { setActiveId(p.id); setShowCommunity(false); setShowDiscovery(false); setShowYC(false); setShowExpert(false); }}
                className={active?"":"ff-row-hover"}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 9px", borderRadius:8, cursor:"pointer", marginBottom:2, background:active?"rgba(31,166,122,.09)":"transparent", border:`1px solid ${active?"rgba(31,166,122,.22)":"transparent"}`, transition:"all .15s" }}
              >
                <span style={{ fontSize:12.5, color:active?"var(--edai-text)":"rgba(255,255,255,.42)", fontWeight:active?600:400, fontFamily:"var(--ff-body)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</span>
                <button onClick={e => { e.stopPropagation(); setProjects(prev => prev.filter(x => x.id !== p.id)); if (activeId === p.id) setActiveId(projects.find(x => x.id !== p.id)?.id || null); }}
                  style={{ background:"none", border:"none", color:"rgba(255,255,255,.15)", cursor:"pointer", fontSize:15, padding:2, flexShrink:0, lineHeight:1 }}>×</button>
              </div>
            );
          })}

          {/* New project */}
          {showSidebarNewProject ? (
            <div style={{ marginTop:4, padding:"8px", borderRadius:8, background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.07)" }}>
              <input value={sidebarProjectName} onChange={e => setSidebarProjectName(e.target.value)} autoFocus
                onKeyDown={e => { if (e.key==="Enter" && sidebarProjectName.trim()) { createProject(sidebarProjectName.trim()); setSidebarProjectName(""); setShowSidebarNewProject(false); } else if (e.key==="Escape") { setSidebarProjectName(""); setShowSidebarNewProject(false); } }}
                onBlur={() => { if (!sidebarProjectName.trim()) { setSidebarProjectName(""); setShowSidebarNewProject(false); } }}
                placeholder="Project name..."
                style={{ width:"100%", padding:"6px 8px", borderRadius:5, border:"1px solid rgba(255,255,255,.08)", background:"transparent", color:"#fff", fontSize:11.5, outline:"none", fontFamily:"var(--ff-body)", marginBottom:6 }} />
              <div style={{ display:"flex", gap:4 }}>
                <button onClick={() => { if (sidebarProjectName.trim()) { createProject(sidebarProjectName.trim()); setSidebarProjectName(""); setShowSidebarNewProject(false); } }} disabled={!sidebarProjectName.trim()}
                  style={{ flex:1, padding:"5px 8px", borderRadius:5, border:"none", background:sidebarProjectName.trim()?"var(--ff-accent)":"rgba(255,255,255,.04)", color:sidebarProjectName.trim()?"#fff":"rgba(255,255,255,.2)", fontSize:11, fontWeight:600, cursor:sidebarProjectName.trim()?"pointer":"not-allowed", fontFamily:"var(--ff-body)" }}>Create</button>
                <button onClick={() => { setSidebarProjectName(""); setShowSidebarNewProject(false); }}
                  style={{ padding:"5px 10px", borderRadius:5, border:"1px solid rgba(255,255,255,.07)", background:"transparent", color:"rgba(255,255,255,.25)", fontSize:11, cursor:"pointer", fontFamily:"var(--ff-body)" }}>×</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowSidebarNewProject(true)}
              style={{ width:"100%", padding:"5px 9px", borderRadius:7, border:"1px dashed rgba(255,255,255,.07)", background:"transparent", color:"rgba(255,255,255,.18)", fontSize:11, cursor:"pointer", fontFamily:"var(--ff-body)", marginTop:3, textAlign:"left" }}>
              + New project
            </button>
          )}

          {/* Personality tag */}
          {personality ? (
            <button onClick={() => setShowPersonality(true)} className="ff-row-hover"
              style={{ marginTop:10, fontSize:11.5, padding:"7px 10px", borderRadius:8, border:"1px solid rgba(31,166,122,.18)", background:"rgba(31,166,122,.06)", color:"rgba(31,166,122,.85)", cursor:"pointer", fontFamily:"var(--ff-body)", fontWeight:500, width:"100%", textAlign:"left", display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:13 }}>✦</span>
              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{getPersonalitySummary(personality).split(" • ")[0]}</span>
            </button>
          ) : personalityChecked ? (
            <button onClick={() => setShowPersonality(true)} className="ff-row-hover"
              style={{ marginTop:10, fontSize:11, padding:"6px 10px", borderRadius:7, border:"1px dashed rgba(255,255,255,.09)", background:"transparent", color:"rgba(255,255,255,.25)", cursor:"pointer", fontFamily:"var(--ff-body)", width:"100%" }}>
              + Personalize my journey
            </button>
          ) : null}
        </div>

        {/* Journey timeline — takes remaining space */}
        <Timeline steps={CURRICULUM} project={project} activeStepId={step.id} activeTaskIdx={taskIdx} onNav={(si,ti) => {
          const ct = project.completedTasks || {};
          if (isTaskLocked(ct, si, ti)) {
            // Locked — describe what's ahead instead of navigating
            setLockedInfo({ step: CURRICULUM[si], task: isStepLocked(ct, si) ? null : CURRICULUM[si].tasks[ti] });
            return;
          }
          setStepIdx(si); setTaskIdx(ti); setShowCommunity(false); setShowDiscovery(false); setShowYC(false); setShowExpert(false);
        }} />

        {/* Bottom: Explore nav + user row */}
        <div style={{ padding:"10px 10px 0", borderTop:"1px solid rgba(255,255,255,.05)", flexShrink:0 }}>
          {[
            { key:"community", label:"Community",      icon:"🤝", on:showCommunity, color:"99,102,241",  text:"rgba(170,170,255,.9)", toggle:() => { setShowCommunity(c => !c); setShowDiscovery(false); setShowYC(false); setShowExpert(false); } },
            { key:"yc",        label:"90 Days at YC",  icon:"🚀", on:showYC,        color:"255,102,0",   text:"#FF8534",              toggle:() => { setShowYC(y => !y); setShowCommunity(false); setShowDiscovery(false); setShowExpert(false); } },
            { key:"expert",    label:"Expert Hire",    icon:"🎯", on:showExpert,    color:"139,92,246",  text:"#A78BFA",              toggle:() => { setShowExpert(e => !e); setShowCommunity(false); setShowDiscovery(false); setShowYC(false); } },
            { key:"discover",  label:"Discover an Idea", icon:"🔍", on:showDiscovery, color:"0,102,204", text:"#5BA3E8",              toggle:() => { setShowDiscovery(d => !d); setShowCommunity(false); setShowYC(false); setShowExpert(false); } },
          ].map(n => (
            <button key={n.key} onClick={n.toggle}
              style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"none", background:n.on?`rgba(${n.color},.08)`:"transparent", color:n.on?n.text:"rgba(255,255,255,.35)", fontSize:12.5, fontWeight:n.on?600:400, cursor:"pointer", fontFamily:"var(--ff-body)", display:"flex", alignItems:"center", gap:8, marginBottom:3, transition:"all .15s", borderLeft:`2px solid ${n.on?`rgb(${n.color})`:"transparent"}` }}
              className={n.on?"":"ff-nav-btn"}
            >
              <span style={{ fontSize:14 }}>{n.icon}</span> {n.label}
            </button>
          ))}

          {/* User row */}
          <div style={{ display:"flex", alignItems:"center", gap:9, padding:"10px 4px 12px", borderTop:"1px solid rgba(255,255,255,.04)", marginTop:4 }}>
            {session.user?.image
              ? <img src={session.user.image} alt="" style={{ width:28, height:28, borderRadius:"50%", objectFit:"cover", border:"1.5px solid rgba(255,255,255,.1)", flexShrink:0 }} />
              : <div style={{ width:28, height:28, borderRadius:"50%", background:"rgba(255,255,255,.07)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"rgba(255,255,255,.4)", fontFamily:"var(--ff-body)", flexShrink:0 }}>{session.user?.name?.[0]}</div>
            }
            <span style={{ flex:1, fontSize:12, color:"rgba(255,255,255,.35)", fontFamily:"var(--ff-body)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{session.user?.name}</span>
            <button onClick={() => signOut()} title="Sign out" className="ff-icon-btn"
              style={{ width:28, height:28, borderRadius:7, border:"none", background:"transparent", color:"rgba(255,255,255,.22)", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              ⏏
            </button>
          </div>
        </div>
      </div>

      {/* Main content area — exactly one of: YC, Discovery, Community, Simulation, or Chat */}
      {showYC ? (
        <div style={{ flex:1, height:"100vh", overflow:"hidden", background:"var(--edai-bg)" }}>
          <NinetyDayYC />
        </div>
      ) : showExpert ? (
        <div style={{ flex:1, height:"100vh", overflow:"hidden", background:"var(--edai-bg)" }}>
          <ExpertHire />
        </div>
      ) : showDiscovery ? (
        <div style={{ flex:1, height:"100vh", overflow:"hidden", background:"var(--edai-bg)" }}>
          <DiscoveryModule onGraduate={(project) => {
            setShowDiscovery(false);
            apiGet("/api/projects").then(d => {
              if (d.projects) {
                const newProj = d.projects.find(p => p.id === project.id);
                if (newProj) { setProjects(d.projects); setActiveId(project.id); }
              }
            }).catch(() => {});
          }} />
        </div>
      ) : showCommunity ? (
        <CommunityTab session={session} sharePrompt={sharePrompt} onShareDone={() => setSharePrompt(null)} />
      ) : task.type === "simulation" ? (
        <PersonaSimulation
          key={`sim-${activeId}-${task.id}`}
          project={project}
          task={task}
          step={step}
          onComplete={handleSimulationComplete}
        />
      ) : (
      <div style={{ flex:1, display:"flex", flexDirection:"column", height:"100vh", minWidth:0, background:"var(--edai-bg)" }}>

        {/* ── Task header ── */}
        <div style={{ padding:"18px 32px 16px", borderBottom:"1px solid rgba(255,255,255,.05)", background:"rgba(255,255,255,.008)", flexShrink:0, position:"relative" }}>
          {/* Step color accent bar */}
          <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:step.color, boxShadow:`0 0 14px ${step.color}55`, borderRadius:"0 2px 2px 0" }} />

          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16 }}>
            <div style={{ flex:1, minWidth:0 }}>
              {/* Breadcrumb */}
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                <span style={{ fontSize:10.5, fontWeight:700, letterSpacing:".16em", color:step.color, fontFamily:"var(--ff-body)", textTransform:"uppercase" }}>{step.icon} {step.title}</span>
                <span style={{ color:"rgba(255,255,255,.18)", fontSize:10 }}>·</span>
                <span style={{ fontSize:10.5, color:"rgba(255,255,255,.28)", fontFamily:"var(--ff-body)" }}>Task {taskIdx+1} of {step.tasks.length}</span>
                {isRevisiting && <span style={{ fontSize:9, fontWeight:700, letterSpacing:".08em", padding:"2px 8px", borderRadius:99, background:"rgba(0,102,204,.12)", color:"#5BA3E8", textTransform:"uppercase" }}>Revisiting</span>}
              </div>
              {/* Task title */}
              <h2 style={{ fontSize:22, fontFamily:"var(--ff-display)", fontWeight:700, letterSpacing:"-.025em", color:"var(--edai-text)", margin:0, lineHeight:1.18 }}>{task.title}</h2>
            </div>

            {/* Action buttons — icon-only */}
            <div style={{ display:"flex", gap:6, flexShrink:0 }}>
              <button onClick={() => setShowMemory(true)} title="Memory & Insights" className="ff-icon-btn"
                style={{ width:36, height:36, borderRadius:9, border:"1px solid rgba(255,255,255,.08)", background:"rgba(255,255,255,.02)", color:"rgba(255,255,255,.35)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
                🧠
              </button>
              <button onClick={() => setShowProfile(true)} title="Profile & Stats" className="ff-icon-btn"
                style={{ width:36, height:36, borderRadius:9, border:"1px solid rgba(255,255,255,.08)", background:"rgba(255,255,255,.02)", color:"rgba(255,255,255,.35)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>
                🏆
              </button>
            </div>
          </div>

          {/* Goal + Output inline strip */}
          {(() => {
            const del = (project.deliverables || {})[task.id];
            return (
              <div style={{ marginTop:12, display:"flex", alignItems:"flex-start", gap:10, padding:"10px 14px", borderRadius:10, background:`${step.color}09`, border:`1px solid ${step.color}20`, flexWrap:"wrap" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:7, flex:1, minWidth:200 }}>
                  <span style={{ fontSize:9, fontWeight:700, letterSpacing:".16em", color:step.color, fontFamily:"var(--ff-body)", textTransform:"uppercase", paddingTop:2, flexShrink:0 }}>Goal</span>
                  <span style={{ fontSize:13, color:"rgba(255,255,255,.65)", fontFamily:"var(--ff-body)", lineHeight:1.55 }}>{task.goal}</span>
                </div>
                {del && (
                  <>
                    <div style={{ width:1, alignSelf:"stretch", background:"rgba(255,255,255,.07)", flexShrink:0 }} />
                    <div style={{ display:"flex", alignItems:"flex-start", gap:7, flex:1, minWidth:200 }}>
                      <span style={{ fontSize:9, fontWeight:700, letterSpacing:".16em", color:"#5BA3E8", fontFamily:"var(--ff-body)", textTransform:"uppercase", paddingTop:2, flexShrink:0 }}>Output</span>
                      <span style={{ fontSize:13, color:"rgba(255,255,255,.58)", fontFamily:"var(--ff-body)", lineHeight:1.55 }}>{del.length > 120 ? del.slice(0,120)+"…" : del}</span>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </div>

        {/* ── Messages ── */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 32px 8px" }}>
          <div style={{ maxWidth:700, margin:"0 auto" }}>
            {activeDeliverable && (
              <CompletedDeliverableCard
                step={step}
                task={task}
                deliverable={activeDeliverable}
                isDraft={activeDeliverableIsDraft}
              />
            )}
            {messages.map((m,i) => <ChatBubble key={i} role={m.role} content={m.content} />)}
            {loading && <TypingDots />}
            {banner && (
              <div style={{ margin:"16px 0", padding:"14px 20px", borderRadius:14, background:`${step.color}0E`, border:`1px solid ${step.color}30`, display:"flex", alignItems:"center", gap:12, animation:"ffSlide .4s" }}>
                <span style={{ fontSize:20 }}>✅</span>
                <div>
                  <div style={{ fontSize:10.5, fontWeight:700, letterSpacing:".1em", color:step.color, fontFamily:"var(--ff-body)", textTransform:"uppercase" }}>Task Complete</div>
                  <div style={{ fontSize:12.5, color:"rgba(255,255,255,.45)", fontFamily:"var(--ff-body)", marginTop:2 }}>{banner} — saved to your journey</div>
                </div>
              </div>
            )}
            <div ref={btmRef} />
          </div>
        </div>

        {/* ── Input area ── */}
        <div style={{ padding:"8px 32px 24px", flexShrink:0 }}>
          <div style={{ maxWidth:700, margin:"0 auto" }}>
            {/* Quick reply pills */}
            {!activeTaskIsComplete && !input.trim() && messages.length > 0 && !loading && (() => {
              const suggestions = getQuickReplies(task, messages);
              return suggestions.length > 0 ? (
                <div style={{ display:"flex", gap:7, marginBottom:10, flexWrap:"wrap" }}>
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => setInput(s)} className="ff-pill"
                      style={{ padding:"7px 15px", borderRadius:99, border:"1px solid rgba(31,166,122,.22)", background:"rgba(31,166,122,.07)", color:"rgba(31,166,122,.9)", fontSize:12.5, fontWeight:500, cursor:"pointer", fontFamily:"var(--ff-body)", whiteSpace:"nowrap" }}>
                      {s}
                    </button>
                  ))}
                </div>
              ) : null;
            })()}

            {activeTaskIsComplete ? (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, padding:"14px 16px", borderRadius:16, border:`1px solid ${step.color}26`, background:`${step.color}0B` }}>
                  <div>
                    <div style={{ fontSize:10.5, fontWeight:800, letterSpacing:".12em", color:step.color, fontFamily:"var(--ff-body)", textTransform:"uppercase", marginBottom:3 }}>Task locked</div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,.55)", fontFamily:"var(--ff-body)" }}>This work is saved. Review the card above or continue when you’re ready.</div>
                  </div>
                  <button onClick={goToNextTask} style={{ border:"none", borderRadius:11, padding:"10px 14px", background:"var(--ff-accent-grad)", color:"#fff", fontSize:12.5, fontWeight:800, fontFamily:"var(--ff-body)", cursor:"pointer", whiteSpace:"nowrap" }}>
                    {activeTaskHasNext ? "Next task →" : "Done"}
                  </button>
                </div>
              ) : (
                <div style={{ display:"flex", alignItems:"flex-end", gap:10, padding:"14px 16px 14px 18px", borderRadius:16, border:"1px solid rgba(255,255,255,.1)", background:"rgba(255,255,255,.035)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)" }}>
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key==="Enter" && (e.metaKey||e.ctrlKey)) { e.preventDefault(); handleSend(); } }}
                    placeholder={loading ? "Mentor is thinking…" : "Share what you found, or ask a question…"}
                    rows={2}
                    style={{ flex:1, background:"transparent", border:"none", color:"var(--edai-text)", fontSize:14.5, lineHeight:1.7, resize:"none", outline:"none", fontFamily:"var(--ff-body)" }}
                  />
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, flexShrink:0 }}>
                    <button onClick={handleSend} disabled={!input.trim()||loading} className="ff-btn-accent"
                      style={{ width:40, height:40, borderRadius:11, border:"none", background:input.trim()&&!loading?"var(--ff-accent-grad)":"rgba(255,255,255,.05)", color:input.trim()&&!loading?"#fff":"rgba(255,255,255,.2)", cursor:input.trim()&&!loading?"pointer":"not-allowed", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>
                      ↑
                    </button>
                    <span style={{ fontSize:9, color:"rgba(255,255,255,.14)", fontFamily:"var(--ff-body)", whiteSpace:"nowrap" }}>⌘↵</span>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
      )}

      {/* Locked step/task preview modal */}
      {lockedInfo && (() => {
        const ls = lockedInfo.step, lt = lockedInfo.task;
        const ct = project?.completedTasks || {};
        const fSi = frontierStepIdx(ct);
        const fStep = CURRICULUM[fSi];
        const fTi = Math.min(ct[fStep.id] || 0, fStep.tasks.length - 1);
        const fTask = fStep.tasks[fTi];
        return (
          <div onClick={() => setLockedInfo(null)} style={{ position:"fixed", inset:0, zIndex:2200, background:"rgba(0,0,0,.62)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", padding:24, animation:"ffSlide .25s" }}>
            <div onClick={e => e.stopPropagation()} style={{ maxWidth:460, width:"100%", borderRadius:18, background:"#101214", border:`1px solid ${ls.color}35`, padding:"26px 28px", position:"relative", boxShadow:"0 20px 60px rgba(0,0,0,.55)" }}>
              <button onClick={() => setLockedInfo(null)} style={{ position:"absolute", top:14, right:16, background:"none", border:"none", color:"rgba(255,255,255,.3)", cursor:"pointer", fontSize:20, lineHeight:1 }}>×</button>

              <div style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"4px 12px", borderRadius:99, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", marginBottom:16 }}>
                <span style={{ fontSize:12 }}>🔒</span>
                <span style={{ fontSize:10, fontWeight:700, letterSpacing:".14em", color:"rgba(255,255,255,.45)", fontFamily:"var(--ff-body)", textTransform:"uppercase" }}>Locked</span>
              </div>

              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                <div style={{ width:38, height:38, borderRadius:11, background:`${ls.color}18`, border:`1.5px solid ${ls.color}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0 }}>{ls.icon}</div>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:".14em", color:ls.color, fontFamily:"var(--ff-body)", textTransform:"uppercase" }}>{lt ? `Step ${ls.id} · ${ls.title}` : `Step ${ls.id}`}</div>
                  <div style={{ fontSize:19, fontFamily:"var(--ff-display)", fontWeight:700, color:"rgba(255,255,255,.94)", letterSpacing:"-.02em", lineHeight:1.2 }}>{lt ? lt.title : ls.title}</div>
                </div>
              </div>

              <p style={{ fontSize:13.5, lineHeight:1.75, color:"rgba(255,255,255,.55)", fontFamily:"var(--ff-body)", margin:"0 0 10px" }}>
                {lt ? lt.goal : ls.overview}
              </p>
              {lt ? (
                <p style={{ fontSize:12.5, lineHeight:1.7, color:"rgba(255,255,255,.38)", fontFamily:"var(--ff-body)", margin:"0 0 18px" }}>
                  <strong style={{ color:"rgba(255,255,255,.5)" }}>You&apos;ll produce:</strong> {lt.output}
                </p>
              ) : (
                <p style={{ fontSize:12.5, lineHeight:1.7, color:"rgba(255,255,255,.38)", fontFamily:"var(--ff-body)", margin:"0 0 18px", fontStyle:"italic" }}>
                  &ldquo;{ls.tagline}&rdquo; · {ls.tasks.length} tasks
                </p>
              )}

              <div style={{ padding:"12px 14px", borderRadius:11, background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", marginBottom:16 }}>
                <div style={{ fontSize:12, color:"rgba(255,255,255,.5)", fontFamily:"var(--ff-body)", lineHeight:1.6 }}>
                  The journey unlocks one task at a time. Finish <strong style={{ color:fStep.color }}>{fTask.title}</strong>{fSi !== CURRICULUM.indexOf(ls) ? ` and the rest of ${fStep.title}` : ""} to get here.
                </div>
              </div>

              <button
                onClick={() => { setStepIdx(fSi); setTaskIdx(fTi); setLockedInfo(null); setShowCommunity(false); setShowDiscovery(false); setShowYC(false); setShowExpert(false); }}
                className="ff-btn-accent"
                style={{ width:"100%", padding:"12px 0", borderRadius:10, border:"none", background:"var(--ff-accent-grad)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"var(--ff-body)" }}
              >
                Continue current task →
              </button>
            </div>
          </div>
        );
      })()}

      {/* Memory Dashboard Modal */}
      {showMemory && (
        <MemoryDashboard 
          userId={session?.user?.email}
          onClose={() => setShowMemory(false)}
        />
      )}
      
      {/* User Profile Modal */}
      {showProfile && (
        <UserProfile onClose={() => setShowProfile(false)} />
      )}
      
      {/* Leaderboard Widget */}
      {showLeaderboard && <LeaderboardWidget />}
      
      {/* Import banner */}
      {importBanner && (
        <div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", zIndex:2100, padding:"10px 18px", borderRadius:10, background:"rgba(16,185,129,.12)", border:"1px solid rgba(16,185,129,.25)", display:"flex", alignItems:"center", gap:10, animation:"ffSlide .4s", boxShadow:"0 4px 24px rgba(0,0,0,.4)" }}>
          <span style={{ fontSize:15 }}>✅</span>
          <span style={{ fontSize:13, color:"rgba(255,255,255,.75)", fontFamily:"var(--ff-body)" }}>We picked up where you left off — your draft has been saved.</span>
          <button onClick={() => setImportBanner(false)} style={{ background:"none", border:"none", color:"rgba(255,255,255,.3)", cursor:"pointer", fontSize:16, lineHeight:1, padding:"0 0 0 4px" }}>×</button>
        </div>
      )}

      {/* Share-to-feed toast (only visible when not already in Community) */}
      {sharePrompt && !showCommunity && (
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", zIndex:2100, padding:"12px 18px", borderRadius:12, background:"rgba(16,16,18,.97)", border:"1px solid rgba(31,166,122,.3)", display:"flex", alignItems:"center", gap:12, animation:"ffSlide .4s", boxShadow:"0 8px 40px rgba(0,0,0,.5)", maxWidth:440 }}>
          <span style={{ fontSize:20, flexShrink:0 }}>🏆</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,.9)", fontFamily:"var(--ff-body)", marginBottom:2 }}>Task complete!</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,.45)", fontFamily:"var(--ff-body)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sharePrompt.milestone}</div>
          </div>
          <button onClick={() => { setShowCommunity(true); }} style={{ padding:"6px 12px", borderRadius:7, border:"none", background:"var(--ff-accent-grad)", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"var(--ff-body)", flexShrink:0 }}>Share to Feed</button>
          <button onClick={() => setSharePrompt(null)} style={{ background:"none", border:"none", color:"rgba(255,255,255,.25)", cursor:"pointer", fontSize:18, lineHeight:1, padding:"0 0 0 4px", flexShrink:0 }}>×</button>
        </div>
      )}

      {/* Notifications */}
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 2000 }}>
        {notifications.map((notif) => {
          if (notif.type === "achievement") {
            return (
              <AchievementNotification
                key={notif.id}
                achievement={notif.data.achievement}
                xpEarned={notif.data.xpEarned}
                onClose={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
              />
            );
          } else if (notif.type === "levelup") {
            return (
              <LevelUpNotification
                key={notif.id}
                newLevel={notif.data.newLevel}
                onClose={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
              />
            );
          } else if (notif.type === "xp") {
            return (
              <XPNotification
                key={notif.id}
                xpEarned={notif.data.xpEarned}
                reason={notif.data.reason}
                onClose={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

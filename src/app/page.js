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

function ChatBubble({ role, content }) {
  const isBot = role === "assistant";
  return (
    <div style={{ display:"flex", gap:10, padding:"5px 0", flexDirection:isBot?"row":"row-reverse", alignItems:"flex-start", animation:"ffSlide .3s ease-out" }}>
      {isBot && <div style={{ width:32, height:32, minWidth:32, borderRadius:9, background:"linear-gradient(135deg,#E8553A,#BE185D)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#fff", fontFamily:"var(--ff-heading)", boxShadow:"0 2px 8px rgba(232,85,58,.25)", marginTop:2 }}>F</div>}
      <div style={{ padding:"12px 16px", borderRadius:14, borderTopLeftRadius:isBot?3:14, borderTopRightRadius:isBot?14:3, background:isBot?"rgba(255,255,255,.04)":"rgba(232,85,58,.1)", border:`1px solid ${isBot?"rgba(255,255,255,.06)":"rgba(232,85,58,.15)"}`, fontSize:14, lineHeight:1.75, color:"rgba(255,255,255,.85)", fontFamily:"var(--ff-body)", whiteSpace:"pre-wrap", maxWidth:"85%" }}>{content}</div>
    </div>
  );
}

function Timeline({ steps, project, activeStepId, activeTaskIdx, onNav }) {
  const ct = project.completedTasks || {};
  const dels = project.deliverables || {};
  const done = Object.values(ct).reduce((a,v) => a+v, 0);
  const pct = TOTAL_TASKS ? Math.round(done/TOTAL_TASKS*100) : 0;

  return (
    <div style={{ flex:1, overflowY:"auto" }}>
      <div style={{ padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,.04)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ flex:1, height:4, borderRadius:2, background:"rgba(255,255,255,.05)", overflow:"hidden" }}>
            <div style={{ height:"100%", borderRadius:2, background:"linear-gradient(90deg,#E8553A,#BE185D)", width:`${pct}%`, transition:"width .6s" }} />
          </div>
          <span style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,.2)", fontFamily:"var(--ff-body)", fontWeight:600 }}>{pct}%</span>
        </div>
      </div>
      {steps.map((s, si) => {
        const sd = ct[s.id] || 0;
        const isActive = s.id === activeStepId;
        const stepDone = sd >= s.tasks.length;
        return (
          <div key={s.id}>
            <div onClick={() => onNav(si, Math.min(sd, s.tasks.length-1))} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px", cursor:"pointer", background:isActive?"rgba(255,255,255,.025)":"transparent", borderLeft:`3px solid ${isActive?s.color:stepDone?s.color+"50":"transparent"}` }}>
              <span style={{ fontSize:14 }}>{stepDone?"✅":s.icon}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:9, fontWeight:700, letterSpacing:".1em", color:isActive?s.color:"rgba(255,255,255,.2)", fontFamily:"var(--ff-body)", fontWeight:600, textTransform:"uppercase" }}>STEP {s.id} · {sd}/{s.tasks.length}</div>
                <div style={{ fontSize:13, color:isActive?"rgba(255,255,255,.85)":"rgba(255,255,255,.4)", fontFamily:"var(--ff-heading)", fontWeight:isActive?700:400, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.title}</div>
              </div>
            </div>
            {(isActive || sd > 0) && <div style={{ padding:"2px 16px 4px 30px" }}>
              {s.tasks.map((t, ti) => {
                const tdone = ti < sd;
                const curr = isActive && ti === activeTaskIdx;
                const d = dels[t.id];
                return (
                  <div key={t.id} style={{ position:"relative", paddingLeft:16, paddingBottom:1 }}>
                    {ti < s.tasks.length-1 && <div style={{ position:"absolute", left:4, top:10, bottom:0, width:1, background:tdone?`${s.color}35`:"rgba(255,255,255,.04)" }} />}
                    <div style={{ position:"absolute", left:0, top:7, width:9, height:9, borderRadius:"50%", background:tdone?s.color:curr?`${s.color}50`:"rgba(255,255,255,.06)", border:curr?`2px solid ${s.color}`:"none", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {tdone && <span style={{ fontSize:6, color:"#fff" }}>✓</span>}
                    </div>
                    <div onClick={() => onNav(si, ti)} style={{ padding:"4px 0", cursor:"pointer" }}>
                      <div style={{ fontSize:11, fontWeight:curr?600:400, color:tdone?"rgba(255,255,255,.45)":curr?"rgba(255,255,255,.75)":"rgba(255,255,255,.14)", fontFamily:"var(--ff-body)", fontWeight:600 }}>{t.title}</div>
                      {tdone && d && <div style={{ marginTop:3, padding:"5px 8px", borderRadius:5, background:"rgba(255,255,255,.018)", border:"1px solid rgba(255,255,255,.03)", fontSize:10.5, lineHeight:1.45, color:"rgba(255,255,255,.28)", fontFamily:"var(--ff-body)" }}>{d.length > 150 ? d.slice(0,150)+"…" : d}</div>}
                    </div>
                  </div>
                );
              })}
            </div>}
          </div>
        );
      })}
    </div>
  );
}

// ── Pre Sign-in Experience ──
function PreSignInExperience() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const btmRef = useRef(null);
  const initRef = useRef(false);

  const scroll = useCallback(() => {
    setTimeout(() => btmRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    callPreview(null, true);
  }, []);

  useEffect(() => { scroll(); }, [messages, loading]);

  async function callPreview(userText, isInit) {
    let apiMsgs;
    let displayMsgs;

    if (isInit) {
      apiMsgs = [{ role: "user", content: "Ready. Guide me." }];
      displayMsgs = [];
    } else {
      displayMsgs = [...messages, { role: "user", content: userText }];
      apiMsgs = displayMsgs.filter(m => m.role === "user" || m.role === "assistant");
      setMessages(displayMsgs);
    }

    setLoading(true);
    scroll();

    try {
      const res = await fetch("/api/chat-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMsgs }),
      });
      const data = await res.json();
      const raw = (data.content || []).map(c => c.text || "").join("") || "Something went wrong — please refresh.";

      const done = raw.includes("[TASK_COMPLETE]");
      const delMatch = raw.match(/\[DELIVERABLE_START\]([\s\S]*?)\[DELIVERABLE_END\]/);
      const deliverable = delMatch ? delMatch[1].trim() : null;
      const clean = raw
        .replace(/\[DELIVERABLE_START\][\s\S]*?\[DELIVERABLE_END\]/g, "")
        .replace(/\[TASK_COMPLETE\]/g, "")
        .trim();

      const next = [...(isInit ? [] : displayMsgs), { role: "assistant", content: clean }];
      setMessages(next);
      if (done) setIsComplete(true);

      try {
        const prev = JSON.parse(localStorage.getItem("ff_guest_session") || "{}");
        localStorage.setItem("ff_guest_session", JSON.stringify({
          messages: next,
          deliverable: deliverable || prev.deliverable || null,
          savedAt: Date.now(),
        }));
      } catch (_) {}
    } catch (e) {
      const err = [...(isInit ? [] : displayMsgs), { role: "assistant", content: "Something went wrong. Please refresh and try again." }];
      setMessages(err);
    } finally {
      setLoading(false);
    }
  }

  function send() {
    const text = input.trim();
    if (!text || loading || isComplete) return;
    setInput("");
    callPreview(text, false);
  }

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"32px 24px", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, opacity:.02, backgroundImage:"radial-gradient(rgba(255,255,255,.7) 1px,transparent 1px)", backgroundSize:"28px 28px" }} />
      <div style={{ position:"absolute", top:"-25%", right:"-10%", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(232,85,58,.06) 0%,transparent 70%)", filter:"blur(80px)" }} />
      <div style={{ width:"100%", maxWidth:1020, display:"grid", gap:24, gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", position:"relative", zIndex:1, alignItems:"start" }}>

        {/* LEFT: Branding */}
        <div style={{ padding:28, borderRadius:18, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.06)" }}>
          <div style={{ width:56, height:56, borderRadius:14, marginBottom:18, background:"linear-gradient(135deg,#E8553A,#BE185D)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, color:"#fff", fontFamily:"var(--ff-heading)", boxShadow:"0 8px 40px rgba(232,85,58,.3)" }}>F</div>
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:".3em", color:"rgba(255,255,255,.18)", marginBottom:12, fontFamily:"var(--ff-body)", textTransform:"uppercase" }}>AI Startup Mentor</div>
          <h1 style={{ fontSize:"clamp(32px,5vw,46px)", fontWeight:400, lineHeight:1.05, margin:"0 0 12px", fontFamily:"var(--ff-heading)", letterSpacing:"-.02em" }}>Founder<span style={{ color:"#E8553A" }}>Forge</span></h1>
          <p style={{ fontSize:20, lineHeight:1.35, color:"#fff", margin:"0 0 12px", fontFamily:"var(--ff-heading)" }}>Get a validated startup hypothesis in 5 minutes.</p>
          <p style={{ fontSize:14, lineHeight:1.7, color:"rgba(255,255,255,.45)", margin:"0 0 20px" }}>
            Try the first task before signup. You will see exactly how the workflow feels before creating an account.
          </p>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18 }}>
            <button
              onClick={() => signIn("google")}
              style={{ padding:"9px 14px", borderRadius:8, border:"none", background:"linear-gradient(135deg,#E8553A,#BE185D)", color:"#fff", cursor:"pointer", fontSize:12, fontWeight:700 }}
            >
              Sign in with Google now
            </button>
            <span style={{ fontSize:12, color:"rgba(255,255,255,.4)", alignSelf:"center" }}>
              or use the chat preview first
            </span>
          </div>
          <div style={{ display:"grid", gap:8, marginBottom:20 }}>
            {[
              "Step-by-step startup guidance (one focused question at a time)",
              "A concrete deliverable saved at every task",
              "A campaign and execution plan you can follow daily",
            ].map(item => (
              <div key={item} style={{ fontSize:12.5, color:"rgba(255,255,255,.55)", padding:"8px 10px", borderRadius:8, border:"1px solid rgba(255,255,255,.06)", background:"rgba(255,255,255,.015)" }}>
                {item}
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {CURRICULUM.map(s => <span key={s.id} style={{ fontSize:9, padding:"3px 8px", borderRadius:4, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.03)", color:"rgba(255,255,255,.18)", fontFamily:"var(--ff-body)", fontWeight:600 }}>{s.icon} {s.title}</span>)}
          </div>
        </div>

        {/* RIGHT: Chat */}
        <div style={{ display:"flex", flexDirection:"column", borderRadius:18, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.06)", overflow:"hidden", minHeight:480 }}>
          {/* Header */}
          <div style={{ padding:"12px 20px", borderBottom:"1px solid rgba(255,255,255,.05)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:"#10B981" }} />
              <span style={{ fontSize:10, color:"rgba(255,255,255,.3)", fontFamily:"var(--ff-body)", fontWeight:700, letterSpacing:".08em", textTransform:"uppercase" }}>Step 1 · Problem Hypothesis · Live Preview</span>
            </div>
            <button onClick={() => signIn("google")} style={{ fontSize:11, color:"rgba(255,255,255,.35)", background:"none", border:"1px solid rgba(255,255,255,.08)", borderRadius:6, padding:"4px 10px", cursor:"pointer", fontFamily:"var(--ff-body)" }}>
              Sign in
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:"auto", padding:"16px 20px", display:"flex", flexDirection:"column", gap:4, minHeight:320, maxHeight:440 }}>
            {messages.length === 0 && loading && <TypingDots />}
            {messages.map((m, i) => <ChatBubble key={i} role={m.role} content={m.content} />)}
            {messages.length > 0 && loading && <TypingDots />}
            <div ref={btmRef} />
          </div>

          {/* Input or Sign-in CTA */}
          {isComplete ? (
            <div style={{ padding:"16px 20px", borderTop:"1px solid rgba(255,255,255,.06)", background:"rgba(16,185,129,.04)" }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#10B981", letterSpacing:".08em", textTransform:"uppercase", marginBottom:6 }}>
                ✓ Task 1.1 Complete
              </div>
              <p style={{ fontSize:13, lineHeight:1.6, color:"rgba(255,255,255,.55)", margin:"0 0 12px" }}>
                Your hypothesis is ready. Sign in to save it and continue to <strong style={{ color:"rgba(255,255,255,.8)" }}>Interview Targets</strong> — the next task in Step 1.
              </p>
              <button
                onClick={() => signIn("google")}
                style={{ width:"100%", padding:"11px 16px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#E8553A,#BE185D)", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:700 }}
              >
                Save & Continue with Google →
              </button>
            </div>
          ) : (
            <>
              <div style={{ padding:"12px 16px", borderTop:"1px solid rgba(255,255,255,.04)", display:"flex", gap:8, alignItems:"flex-end" }}>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder={loading ? "Mentor is thinking…" : "Type your answer… (Enter to send)"}
                  disabled={loading}
                  rows={2}
                  style={{ flex:1, padding:"10px 12px", borderRadius:10, border:"1px solid rgba(255,255,255,.1)", background:"rgba(255,255,255,.03)", color:"#fff", fontSize:13, lineHeight:1.5, resize:"none", outline:"none", fontFamily:"var(--ff-body)", opacity:loading ? 0.5 : 1 }}
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || loading}
                  style={{ padding:"10px 16px", borderRadius:10, border:"none", background:input.trim() && !loading ? "linear-gradient(135deg,#E8553A,#BE185D)" : "rgba(255,255,255,.05)", color:input.trim() && !loading ? "#fff" : "rgba(255,255,255,.2)", cursor:input.trim() && !loading ? "pointer" : "not-allowed", fontSize:13, fontWeight:700, whiteSpace:"nowrap", alignSelf:"stretch" }}
                >
                  Send
                </button>
              </div>
              <div style={{ padding:"0 16px 12px", textAlign:"center" }}>
                <button onClick={() => signIn("google")} style={{ fontSize:11, color:"rgba(255,255,255,.2)", background:"none", border:"none", cursor:"pointer", textDecoration:"underline", fontFamily:"var(--ff-body)" }}>
                  Already have an account? Sign in
                </button>
              </div>
            </>
          )}
        </div>
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
  const [sharePrompt, setSharePrompt] = useState(null); // {body, milestone, taskId, stepId}
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
        
        setTimeout(() => {
          setBanner(null);
          if (taskIdx < step.tasks.length-1) {
            setTaskIdx(taskIdx+1);
            setTaskStartTime(Date.now()); // Set start time for new task
          } else if (stepIdx < CURRICULUM.length-1) { 
            setStepIdx(stepIdx+1); 
            setTaskIdx(0);
            setTaskStartTime(Date.now()); // Set start time for new task
          }
        }, 2200);
      }
    } catch (e) {
      const err = [...displayMsgs, { role: "assistant", content: "Connection issue — try again." }];
      setMessages(err); saveMsgs(task.id, err);
    }
    setLoading(false); scroll();
  }

  function handleSend() { if (!input.trim() || loading) return; const t = input.trim(); setInput(""); callMentor(t, false); }

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
  if (status === "unauthenticated") return <PreSignInExperience />;
  if (!dataLoaded) return <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}><TypingDots /></div>;

  const isRevisiting = project && task && (project.completedTasks?.[step?.id]||0) > taskIdx;

  // Show personality assessment for first-time users (no personality and checked)
  if (!project && personalityChecked && !personality && !showPersonality) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:32, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, opacity:.02, backgroundImage:"radial-gradient(rgba(255,255,255,.7) 1px,transparent 1px)", backgroundSize:"28px 28px" }} />
        <div style={{ textAlign:"center", maxWidth:520, position:"relative", zIndex:1 }}>
          <div style={{ width:60, height:60, borderRadius:16, margin:"0 auto 24px", background:"linear-gradient(135deg,#E8553A,#BE185D)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, color:"#fff", fontFamily:"var(--ff-heading)", boxShadow:"0 8px 40px rgba(232,85,58,.3)" }}>F</div>
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
                background:"linear-gradient(135deg,#E8553A,#BE185D)", 
                color:"#fff", 
                fontSize:13, 
                fontWeight:700, 
                cursor:"pointer", 
                fontFamily:"var(--ff-body)", 
                boxShadow:"0 4px 30px rgba(232,85,58,.3)" 
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

  // No projects yet (after personality or skip)
  if (!project) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:32, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, opacity:.02, backgroundImage:"radial-gradient(rgba(255,255,255,.7) 1px,transparent 1px)", backgroundSize:"28px 28px" }} />
        <div style={{ textAlign:"center", maxWidth:460, position:"relative", zIndex:1 }}>
          <div style={{ width:60, height:60, borderRadius:16, margin:"0 auto 24px", background:"linear-gradient(135deg,#E8553A,#BE185D)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, color:"#fff", fontFamily:"var(--ff-heading)", boxShadow:"0 8px 40px rgba(232,85,58,.3)" }}>F</div>
          <p style={{ fontSize:13, color:"rgba(255,255,255,.35)", marginBottom:4 }}>Welcome, {session.user.name}</p>
          {personality && (
            <p style={{ fontSize:10, color:"rgba(232,85,58,.6)", marginBottom:12, fontFamily:"var(--ff-body)", fontWeight:600 }}>
              {getPersonalitySummary(personality)}
            </p>
          )}
          <h1 style={{ fontSize:32, fontFamily:"var(--ff-heading)", margin:"0 0 24px" }}>Start your first project</h1>
          {showNewForm ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
              <input value={newName} onChange={e => setNewName(e.target.value)} autoFocus
                onKeyDown={e => { if (e.key==="Enter" && newName.trim()) { createProject(newName.trim()); setNewName(""); setShowNewForm(false); } }}
                placeholder="Name your startup idea..."
                style={{ width:280, padding:"12px 18px", borderRadius:10, textAlign:"center", border:"1px solid rgba(255,255,255,.15)", background:"rgba(255,255,255,.04)", color:"#fff", fontSize:14, outline:"none", fontFamily:"var(--ff-body)" }} />
              <button onClick={() => { if (newName.trim()) { createProject(newName.trim()); setNewName(""); setShowNewForm(false); } }} disabled={!newName.trim()}
                style={{ padding:"10px 28px", borderRadius:8, border:"none", background:newName.trim()?"linear-gradient(135deg,#E8553A,#BE185D)":"rgba(255,255,255,.05)", color:newName.trim()?"#fff":"rgba(255,255,255,.2)", fontSize:12, fontWeight:700, cursor:newName.trim()?"pointer":"not-allowed", fontFamily:"var(--ff-body)", fontWeight:600 }}>BEGIN →</button>
            </div>
          ) : (
            <button onClick={() => setShowNewForm(true)} style={{ padding:"14px 36px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#E8553A,#BE185D)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"var(--ff-body)", fontWeight:600, boxShadow:"0 4px 30px rgba(232,85,58,.3)" }}>NEW PROJECT →</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height:"100vh", display:"flex" }}>
      {/* Sidebar */}
      <div style={{ width:280, minWidth:280, height:"100vh", background:"rgba(255,255,255,.012)", borderRight:"1px solid rgba(255,255,255,.05)", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,.05)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div style={{ fontSize:18, fontFamily:"var(--ff-heading)" }}>Founder<span style={{ color:"#E8553A" }}>Forge</span></div>
            <button onClick={() => signOut()} style={{ fontSize:10, padding:"4px 8px", borderRadius:4, border:"1px solid rgba(255,255,255,.08)", background:"transparent", color:"rgba(255,255,255,.25)", cursor:"pointer", fontFamily:"var(--ff-body)", fontWeight:600 }}>Sign out</button>
          </div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.3)", marginBottom:4, fontFamily:"var(--ff-body)" }}>{session.user.name}</div>
          {personality && (
            <button 
              onClick={() => setShowPersonality(true)}
              style={{ 
                fontSize:9, 
                padding:"3px 6px", 
                borderRadius:4, 
                border:"1px solid rgba(232,85,58,.2)", 
                background:"rgba(232,85,58,.05)", 
                color:"rgba(232,85,58,.7)", 
                cursor:"pointer", 
                fontFamily:"var(--ff-body)", 
                fontWeight:600,
                marginBottom:12,
                width:"100%",
                textAlign:"left"
              }}
            >
              ✨ {getPersonalitySummary(personality).split(" • ").slice(0, 2).join(" • ")}
            </button>
          )}
          {!personality && personalityChecked && (
            <button 
              onClick={() => setShowPersonality(true)}
              style={{ 
                fontSize:9, 
                padding:"3px 6px", 
                borderRadius:4, 
                border:"1px dashed rgba(255,255,255,.1)", 
                background:"transparent", 
                color:"rgba(255,255,255,.25)", 
                cursor:"pointer", 
                fontFamily:"var(--ff-body)", 
                fontWeight:600,
                marginBottom:12,
                width:"100%"
              }}
            >
              + Add personality profile
            </button>
          )}
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:".1em", color:"rgba(255,255,255,.15)", fontFamily:"var(--ff-body)", fontWeight:600, marginBottom:6 }}>PROJECTS</div>
          {projects.map(p => (
            <div key={p.id} onClick={() => setActiveId(p.id)} style={{ padding:"6px 10px", borderRadius:6, cursor:"pointer", marginBottom:2, background:p.id===activeId?"rgba(255,255,255,.05)":"transparent", border:p.id===activeId?"1px solid rgba(255,255,255,.08)":"1px solid transparent", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontSize:12, color:p.id===activeId?"rgba(255,255,255,.9)":"rgba(255,255,255,.4)", fontFamily:"var(--ff-body)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</span>
              <button onClick={e => { e.stopPropagation(); setProjects(prev => prev.filter(x => x.id !== p.id)); if (activeId === p.id) setActiveId(projects.find(x => x.id !== p.id)?.id || null); }}
                style={{ background:"none", border:"none", color:"rgba(255,255,255,.1)", cursor:"pointer", fontSize:13, padding:2 }}>×</button>
            </div>
          ))}
          {showSidebarNewProject ? (
            <div style={{ marginTop:4, padding:"8px", borderRadius:6, background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.08)" }}>
              <input 
                value={sidebarProjectName} 
                onChange={e => setSidebarProjectName(e.target.value)} 
                autoFocus
                onKeyDown={e => { 
                  if (e.key==="Enter" && sidebarProjectName.trim()) { 
                    createProject(sidebarProjectName.trim()); 
                    setSidebarProjectName(""); 
                    setShowSidebarNewProject(false); 
                  } else if (e.key==="Escape") {
                    setSidebarProjectName("");
                    setShowSidebarNewProject(false);
                  }
                }}
                onBlur={() => {
                  if (!sidebarProjectName.trim()) {
                    setSidebarProjectName("");
                    setShowSidebarNewProject(false);
                  }
                }}
                placeholder="Project name..."
                style={{ 
                  width:"100%", 
                  padding:"6px 8px", 
                  borderRadius:4, 
                  border:"1px solid rgba(255,255,255,.1)", 
                  background:"rgba(255,255,255,.02)", 
                  color:"#fff", 
                  fontSize:11, 
                  outline:"none", 
                  fontFamily:"var(--ff-body)",
                  marginBottom:4
                }} 
              />
              <div style={{ display:"flex", gap:4 }}>
                <button 
                  onClick={() => { 
                    if (sidebarProjectName.trim()) { 
                      createProject(sidebarProjectName.trim()); 
                      setSidebarProjectName(""); 
                      setShowSidebarNewProject(false); 
                    } 
                  }} 
                  disabled={!sidebarProjectName.trim()}
                  style={{ 
                    flex:1, 
                    padding:"4px 8px", 
                    borderRadius:3, 
                    border:"none", 
                    background:sidebarProjectName.trim()?"#E8553A":"rgba(255,255,255,.05)", 
                    color:sidebarProjectName.trim()?"#fff":"rgba(255,255,255,.2)", 
                    fontSize:10, 
                    fontWeight:600, 
                    cursor:sidebarProjectName.trim()?"pointer":"not-allowed", 
                    fontFamily:"var(--ff-body)" 
                  }}
                >
                  Create
                </button>
                <button 
                  onClick={() => { 
                    setSidebarProjectName(""); 
                    setShowSidebarNewProject(false); 
                  }}
                  style={{ 
                    padding:"4px 8px", 
                    borderRadius:3, 
                    border:"1px solid rgba(255,255,255,.08)", 
                    background:"transparent", 
                    color:"rgba(255,255,255,.3)", 
                    fontSize:10, 
                    cursor:"pointer", 
                    fontFamily:"var(--ff-body)" 
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowSidebarNewProject(true)}
              style={{ width:"100%", padding:"6px", borderRadius:5, border:"1px dashed rgba(255,255,255,.08)", background:"transparent", color:"rgba(255,255,255,.2)", fontSize:10, cursor:"pointer", fontFamily:"var(--ff-body)", fontWeight:600, marginTop:4 }}>+ New Project</button>
          )}
        </div>
        <Timeline steps={CURRICULUM} project={project} activeStepId={step.id} activeTaskIdx={taskIdx} onNav={(si,ti) => { setStepIdx(si); setTaskIdx(ti); setShowCommunity(false); }} />

        {/* Community + Discovery + YC nav buttons */}
        <div style={{ padding:"10px 12px", borderTop:"1px solid rgba(255,255,255,.04)", flexShrink:0, display:"flex", flexDirection:"column", gap:6 }}>
          <button onClick={() => { setShowCommunity(c => !c); setShowDiscovery(false); setShowYC(false); }} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${showCommunity?"rgba(232,85,58,.3)":"rgba(255,255,255,.06)"}`, background:showCommunity?"rgba(232,85,58,.08)":"transparent", color:showCommunity?"#E8553A":"rgba(255,255,255,.35)", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"var(--ff-body)", display:"flex", alignItems:"center", gap:7, transition:"all .15s" }}>
            <span style={{ fontSize:14 }}>🤝</span> Community
          </button>
          <button onClick={() => { setShowDiscovery(d => !d); setShowCommunity(false); setShowYC(false); }} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${showDiscovery?"rgba(99,102,241,.4)":"rgba(255,255,255,.06)"}`, background:showDiscovery?"rgba(99,102,241,.1)":"transparent", color:showDiscovery?"#818cf8":"rgba(255,255,255,.35)", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"var(--ff-body)", display:"flex", alignItems:"center", gap:7, transition:"all .15s" }}>
            <span style={{ fontSize:14 }}>🔍</span> Discover an Idea
          </button>
          <button onClick={() => { setShowYC(y => !y); setShowCommunity(false); setShowDiscovery(false); }} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${showYC?"rgba(255,102,0,.4)":"rgba(255,255,255,.06)"}`, background:showYC?"rgba(255,102,0,.1)":"transparent", color:showYC?"#FF6600":"rgba(255,255,255,.35)", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"var(--ff-body)", display:"flex", alignItems:"center", gap:7, transition:"all .15s" }}>
            <span style={{ fontSize:14 }}>🚀</span> 90 Days at YC
          </button>
        </div>
      </div>

      {/* Main content area — exactly one of: YC, Discovery, Community, Simulation, or Chat */}
      {showYC ? (
        <div style={{ flex:1, height:"100vh", overflow:"hidden", background:"#f9fafb" }}>
          <NinetyDayYC />
        </div>
      ) : showDiscovery ? (
        <div style={{ flex:1, height:"100vh", overflow:"hidden", background:"#f9fafb" }}>
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
      <div style={{ flex:1, display:"flex", flexDirection:"column", height:"100vh", minWidth:0 }}>
        <div style={{ padding:"10px 20px", borderBottom:"1px solid rgba(255,255,255,.05)", background:"rgba(255,255,255,.012)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:16 }}>{step.icon}</span>
            <div>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:".11em", color:step.color, fontFamily:"var(--ff-body)", fontWeight:600, textTransform:"uppercase" }}>STEP {step.id} · TASK {taskIdx+1}/{step.tasks.length}{isRevisiting?" · REVISITING":""}</div>
              <div style={{ fontSize:14, fontFamily:"var(--ff-heading)", color:"rgba(255,255,255,.9)" }}>{task.title}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setShowMemory(true)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,.08)",
                background: "rgba(255,255,255,.02)",
                color: "rgba(255,255,255,.4)",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--ff-body)",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <span style={{ fontSize: 14 }}>🧠</span>
              Memory & Insights
            </button>
            <button
              onClick={() => setShowProfile(true)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,.08)",
                background: "rgba(255,255,255,.02)",
                color: "rgba(255,255,255,.4)",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "var(--ff-body)",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <span style={{ fontSize: 14 }}>🏆</span>
              Profile & Stats
            </button>
          </div>
        </div>
        <div style={{ padding:"8px 20px", borderBottom:"1px solid rgba(255,255,255,.03)" }}>
          <div style={{ maxWidth:660, margin:"0 auto", display:"flex", gap:6, flexWrap:"wrap" }}>
            <div style={{ flex:1, minWidth:180, padding:"6px 10px", borderRadius:6, background:`${step.color}06`, border:`1px solid ${step.color}10`, display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:8, fontWeight:700, letterSpacing:".1em", padding:"2px 5px", borderRadius:3, background:`${step.color}15`, color:step.color, fontFamily:"var(--ff-body)", fontWeight:600, textTransform:"uppercase" }}>GOAL</span>
              <span style={{ fontSize:11, color:"rgba(255,255,255,.4)", fontFamily:"var(--ff-body)", lineHeight:1.3 }}>{task.goal}</span>
            </div>
            <div style={{ flex:1, minWidth:180, padding:"6px 10px", borderRadius:6, background:"rgba(255,255,255,.015)", border:"1px solid rgba(255,255,255,.03)", display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:8, fontWeight:700, letterSpacing:".1em", padding:"2px 5px", borderRadius:3, background:"rgba(255,255,255,.05)", color:"rgba(255,255,255,.25)", fontFamily:"var(--ff-body)", fontWeight:600, textTransform:"uppercase" }}>OUTPUT</span>
              <span style={{ fontSize:11, color:"rgba(255,255,255,.25)", fontFamily:"var(--ff-body)", lineHeight:1.3 }}>{task.output}</span>
            </div>
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"12px 20px 8px" }}>
          <div style={{ maxWidth:660, margin:"0 auto" }}>
            {messages.map((m,i) => <ChatBubble key={i} role={m.role} content={m.content} />)}
            {loading && <TypingDots />}
            {banner && <div style={{ margin:"10px 0", padding:"10px 16px", borderRadius:8, background:`${step.color}0D`, border:`1px solid ${step.color}20`, display:"flex", alignItems:"center", gap:8, animation:"ffSlide .4s" }}><span style={{ fontSize:16 }}>✅</span><div><div style={{ fontSize:10, fontWeight:700, color:step.color, fontFamily:"var(--ff-body)", fontWeight:600 }}>TASK COMPLETE</div><div style={{ fontSize:11, color:"rgba(255,255,255,.4)", fontFamily:"var(--ff-body)" }}>{banner} — saved</div></div></div>}
            <div ref={btmRef} />
          </div>
        </div>
        <div style={{ padding:"10px 20px 12px", borderTop:"1px solid rgba(255,255,255,.04)", background:"rgba(255,255,255,.008)" }}>
          <div style={{ maxWidth:660, margin:"0 auto", display:"flex", gap:8, alignItems:"flex-end" }}>
            <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Share your work here..." rows={2}
              style={{ flex:1, padding:"10px 14px", borderRadius:9, border:"1px solid rgba(255,255,255,.06)", background:"rgba(255,255,255,.02)", color:"rgba(255,255,255,.9)", fontSize:13.5, lineHeight:1.6, resize:"none", outline:"none", fontFamily:"var(--ff-body)" }} />
            <button onClick={handleSend} disabled={!input.trim()||loading}
              style={{ padding:"10px 16px", borderRadius:9, border:"none", background:input.trim()&&!loading?"linear-gradient(135deg,#E8553A,#BE185D)":"rgba(255,255,255,.03)", color:input.trim()&&!loading?"#fff":"rgba(255,255,255,.12)", fontSize:12, fontWeight:600, cursor:input.trim()&&!loading?"pointer":"not-allowed", fontFamily:"var(--ff-body)", fontWeight:600, minWidth:56 }}>Send</button>
          </div>
        </div>
      </div>
      )}

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
        <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", zIndex:2100, padding:"12px 18px", borderRadius:12, background:"rgba(16,16,18,.97)", border:"1px solid rgba(232,85,58,.3)", display:"flex", alignItems:"center", gap:12, animation:"ffSlide .4s", boxShadow:"0 8px 40px rgba(0,0,0,.5)", maxWidth:440 }}>
          <span style={{ fontSize:20, flexShrink:0 }}>🏆</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,.9)", fontFamily:"var(--ff-body)", marginBottom:2 }}>Task complete!</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,.45)", fontFamily:"var(--ff-body)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sharePrompt.milestone}</div>
          </div>
          <button onClick={() => { setShowCommunity(true); }} style={{ padding:"6px 12px", borderRadius:7, border:"none", background:"linear-gradient(135deg,#E8553A,#BE185D)", color:"#fff", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"var(--ff-body)", flexShrink:0 }}>Share to Feed</button>
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

"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { CURRICULUM, TOTAL_TASKS } from "@/lib/curriculum";

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

// ── Login Screen ──
function LoginScreen() {
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:32, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, opacity:.02, backgroundImage:"radial-gradient(rgba(255,255,255,.7) 1px,transparent 1px)", backgroundSize:"28px 28px" }} />
      <div style={{ position:"absolute", top:"-25%", right:"-10%", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(232,85,58,.06) 0%,transparent 70%)", filter:"blur(80px)" }} />
      <div style={{ textAlign:"center", maxWidth:460, position:"relative", zIndex:1 }}>
        <div style={{ width:60, height:60, borderRadius:16, margin:"0 auto 24px", background:"linear-gradient(135deg,#E8553A,#BE185D)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, color:"#fff", fontFamily:"var(--ff-heading)", boxShadow:"0 8px 40px rgba(232,85,58,.3)" }}>F</div>
        <div style={{ fontSize:10, fontWeight:700, letterSpacing:".3em", color:"rgba(255,255,255,.18)", marginBottom:14, fontFamily:"var(--ff-body)", fontWeight:600 }}>AI STARTUP MENTOR</div>
        <h1 style={{ fontSize:"clamp(34px,5vw,48px)", fontWeight:400, lineHeight:1.1, margin:"0 0 14px", fontFamily:"var(--ff-heading)", letterSpacing:"-.02em" }}>Founder<span style={{ color:"#E8553A" }}>Forge</span></h1>
        <p style={{ fontSize:15, lineHeight:1.7, color:"rgba(255,255,255,.4)", margin:"0 auto 36px", maxWidth:380 }}>From idea to revenue in 6 steps. Sign in to start your journey.</p>
        <button onClick={() => signIn("google")} style={{ padding:"14px 32px", borderRadius:10, border:"1px solid rgba(255,255,255,.12)", background:"rgba(255,255,255,.04)", color:"#fff", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"var(--ff-body)", display:"inline-flex", alignItems:"center", gap:10, transition:"all .2s" }}
          onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,.08)"}
          onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,.04)"}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>
        <div style={{ marginTop:40, display:"flex", gap:6, justifyContent:"center", flexWrap:"wrap" }}>
          {CURRICULUM.map(s => <span key={s.id} style={{ fontSize:9, padding:"3px 8px", borderRadius:4, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.03)", color:"rgba(255,255,255,.18)", fontFamily:"var(--ff-body)", fontWeight:600 }}>{s.icon} {s.title}</span>)}
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
  const btmRef = useRef(null);
  const needsInitRef = useRef(false);

  const project = projects.find(p => p.id === activeId) || null;
  const step = CURRICULUM[stepIdx];
  const task = step?.tasks[taskIdx];

  const scroll = useCallback(() => setTimeout(() => btmRef.current?.scrollIntoView({ behavior:"smooth" }), 100), []);

  // Load user data
  useEffect(() => {
    if (status === "authenticated") {
      apiGet("/api/projects").then(data => {
        const projs = data.projects || [];
        setProjects(projs);
        if (projs.length > 0) setActiveId(projs[0].id);
        setDataLoaded(true);
      }).catch(() => setDataLoaded(true));
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
      const data = await apiPost("/api/chat", { messages: apiMsgs, stepId: step.id, taskIdx, project });
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
        setTimeout(() => {
          setBanner(null);
          if (taskIdx < step.tasks.length-1) setTaskIdx(taskIdx+1);
          else if (stepIdx < CURRICULUM.length-1) { setStepIdx(stepIdx+1); setTaskIdx(0); }
        }, 2200);
      }
    } catch (e) {
      const err = [...displayMsgs, { role: "assistant", content: "Connection issue — try again." }];
      setMessages(err); saveMsgs(task.id, err);
    }
    setLoading(false); scroll();
  }

  function handleSend() { if (!input.trim() || loading) return; const t = input.trim(); setInput(""); callMentor(t, false); }

  function createProject(name) {
    const p = { id: "p_" + Date.now(), name, completedTasks: {}, deliverables: {}, taskMessages: {} };
    setProjects(prev => [...prev, p]);
    setActiveId(p.id);
  }

  // Auth states
  if (status === "loading") return <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}><TypingDots /></div>;
  if (status === "unauthenticated") return <LoginScreen />;
  if (!dataLoaded) return <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}><TypingDots /></div>;

  const isRevisiting = project && task && (project.completedTasks?.[step?.id]||0) > taskIdx;

  // No projects yet
  if (!project) {
    return (
      <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:32, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, opacity:.02, backgroundImage:"radial-gradient(rgba(255,255,255,.7) 1px,transparent 1px)", backgroundSize:"28px 28px" }} />
        <div style={{ textAlign:"center", maxWidth:460, position:"relative", zIndex:1 }}>
          <div style={{ width:60, height:60, borderRadius:16, margin:"0 auto 24px", background:"linear-gradient(135deg,#E8553A,#BE185D)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, color:"#fff", fontFamily:"var(--ff-heading)", boxShadow:"0 8px 40px rgba(232,85,58,.3)" }}>F</div>
          <p style={{ fontSize:13, color:"rgba(255,255,255,.35)", marginBottom:4 }}>Welcome, {session.user.name}</p>
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
          <div style={{ fontSize:11, color:"rgba(255,255,255,.3)", marginBottom:8, fontFamily:"var(--ff-body)" }}>{session.user.name}</div>
          <div style={{ fontSize:9, fontWeight:700, letterSpacing:".1em", color:"rgba(255,255,255,.15)", fontFamily:"var(--ff-body)", fontWeight:600, marginBottom:6 }}>PROJECTS</div>
          {projects.map(p => (
            <div key={p.id} onClick={() => setActiveId(p.id)} style={{ padding:"6px 10px", borderRadius:6, cursor:"pointer", marginBottom:2, background:p.id===activeId?"rgba(255,255,255,.05)":"transparent", border:p.id===activeId?"1px solid rgba(255,255,255,.08)":"1px solid transparent", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontSize:12, color:p.id===activeId?"rgba(255,255,255,.9)":"rgba(255,255,255,.4)", fontFamily:"var(--ff-body)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</span>
              <button onClick={e => { e.stopPropagation(); setProjects(prev => prev.filter(x => x.id !== p.id)); if (activeId === p.id) setActiveId(projects.find(x => x.id !== p.id)?.id || null); }}
                style={{ background:"none", border:"none", color:"rgba(255,255,255,.1)", cursor:"pointer", fontSize:13, padding:2 }}>×</button>
            </div>
          ))}
          <button onClick={() => { const n = "Project " + (projects.length+1); createProject(n); }}
            style={{ width:"100%", padding:"6px", borderRadius:5, border:"1px dashed rgba(255,255,255,.08)", background:"transparent", color:"rgba(255,255,255,.2)", fontSize:10, cursor:"pointer", fontFamily:"var(--ff-body)", fontWeight:600, marginTop:4 }}>+ New Project</button>
        </div>
        <Timeline steps={CURRICULUM} project={project} activeStepId={step.id} activeTaskIdx={taskIdx} onNav={(si,ti) => { setStepIdx(si); setTaskIdx(ti); }} />
      </div>

      {/* Chat */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", height:"100vh", minWidth:0 }}>
        <div style={{ padding:"10px 20px", borderBottom:"1px solid rgba(255,255,255,.05)", background:"rgba(255,255,255,.012)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:16 }}>{step.icon}</span>
            <div>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:".11em", color:step.color, fontFamily:"var(--ff-body)", fontWeight:600, textTransform:"uppercase" }}>STEP {step.id} · TASK {taskIdx+1}/{step.tasks.length}{isRevisiting?" · REVISITING":""}</div>
              <div style={{ fontSize:14, fontFamily:"var(--ff-heading)", color:"rgba(255,255,255,.9)" }}>{task.title}</div>
            </div>
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
    </div>
  );
}

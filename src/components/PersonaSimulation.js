import { useState, useEffect, useRef, useCallback } from "react";

const PERSONA_COLORS = ["#0D9488", "#7C3AED"];

function SimChatBubble({ role, content, personaInitial, personaColor }) {
  const isPersona = role === "assistant";
  return (
    <div style={{ display:"flex", gap:10, padding:"5px 0", flexDirection:isPersona?"row":"row-reverse", alignItems:"flex-start", animation:"ffSlide .3s ease-out" }}>
      {isPersona && (
        <div style={{ width:32, height:32, minWidth:32, borderRadius:9, background:`linear-gradient(135deg,${personaColor},${personaColor}bb)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#fff", fontFamily:"var(--ff-heading)", boxShadow:`0 2px 8px ${personaColor}40`, marginTop:2 }}>
          {personaInitial}
        </div>
      )}
      <div style={{ padding:"12px 16px", borderRadius:14, borderTopLeftRadius:isPersona?3:14, borderTopRightRadius:isPersona?14:3, background:isPersona?"rgba(255,255,255,.04)":"rgba(232,85,58,.1)", border:`1px solid ${isPersona?"rgba(255,255,255,.06)":"rgba(232,85,58,.15)"}`, fontSize:14, lineHeight:1.75, color:"rgba(255,255,255,.85)", fontFamily:"var(--ff-body)", whiteSpace:"pre-wrap", maxWidth:"85%" }}>
        {content}
      </div>
    </div>
  );
}

function LoadingDots({ color }) {
  return (
    <div style={{ display:"flex", gap:5, padding:"10px 0", alignItems:"center" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:color || "rgba(255,255,255,.2)", opacity:.5, animation:`ffBounce 1.4s ${i*.15}s infinite` }} />
      ))}
    </div>
  );
}

export default function PersonaSimulation({ project, task, step, onComplete }) {
  const [phase, setPhase] = useState("loading");
  const [personas, setPersonas] = useState(null);
  const [currentPersonaIdx, setCurrentPersonaIdx] = useState(0);
  const [currentMessages, setCurrentMessages] = useState([]);
  const [transcripts, setTranscripts] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [interviewWrapped, setInterviewWrapped] = useState(false);
  const [debrief, setDebrief] = useState(null);
  const btmRef = useRef(null);
  const initRef = useRef(false);
  const transcriptsRef = useRef([]);

  const scroll = useCallback(() => {
    setTimeout(() => btmRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }, []);

  useEffect(() => { scroll(); }, [currentMessages, loading]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    generatePersonas();
  }, []);

  async function generatePersonas() {
    const hypothesis = project?.deliverables?.["1.1"] || "";
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "generate", hypothesis }),
      });
      const data = await res.json();
      if (data.personas?.length >= 2) {
        setPersonas(data.personas);
        setPhase("setup");
      } else {
        setPhase("error");
      }
    } catch (e) {
      console.error("generate error:", e);
      setPhase("error");
    }
  }

  function startInterview(idx) {
    const persona = personas[idx];
    setCurrentMessages([{ role: "assistant", content: persona.internal.openingLine }]);
    setCurrentPersonaIdx(idx);
    setInterviewWrapped(false);
    setInput("");
    setPhase("interview");
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading || interviewWrapped) return;
    setInput("");

    const persona = personas[currentPersonaIdx];
    const newMsgs = [...currentMessages, { role: "user", content: text }];
    setCurrentMessages(newMsgs);
    setLoading(true);
    scroll();

    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "interview", persona, messages: newMsgs }),
      });
      const data = await res.json();
      const raw = (data.content || []).map(c => c.text || "").join("") || "...";
      const wrapped = raw.includes("[INTERVIEW_WRAP]");
      const clean = raw.replace(/\[INTERVIEW_WRAP\]/g, "").trim();

      const finalMsgs = [...newMsgs, { role: "assistant", content: clean }];
      setCurrentMessages(finalMsgs);

      if (wrapped) {
        const transcript = {
          personaName: persona.name,
          personaRole: persona.role,
          callObjective: persona.callObjective,
          messages: finalMsgs,
        };
        const updated = [...transcriptsRef.current, transcript];
        transcriptsRef.current = updated;
        setTranscripts(updated);
        setInterviewWrapped(true);
      }
    } catch (e) {
      setCurrentMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  function continueAfterInterview() {
    if (currentPersonaIdx === 0) {
      startInterview(1);
    } else {
      setPhase("debrief_loading");
      generateDebrief();
    }
  }

  async function generateDebrief() {
    const hypothesis = project?.deliverables?.["1.1"] || "";
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "debrief", hypothesis, transcripts: transcriptsRef.current }),
      });
      const data = await res.json();
      if (data.debrief) {
        setDebrief(data.debrief);
        setPhase("debrief");
      } else {
        setPhase("error");
      }
    } catch (e) {
      console.error("debrief error:", e);
      setPhase("error");
    }
  }

  function buildDeliverableText() {
    if (!debrief) return "Interview simulation completed.";
    const parts = ["PRACTICE INTERVIEW SIMULATION DEBRIEF", ""];
    (debrief.interviews || []).forEach((intv, i) => {
      parts.push(`Call ${i + 1}: ${intv.personaName}`);
      parts.push(`Key signal found: ${intv.keySignalFound ? "Yes" : "Not yet"}`);
      if (intv.keySignalNote) parts.push(`Signal: ${intv.keySignalNote}`);
      if (intv.whatWorked?.length) parts.push(`What worked: ${intv.whatWorked.join("; ")}`);
      if (intv.whatMissed?.length) parts.push(`To sharpen: ${intv.whatMissed.join("; ")}`);
      parts.push("");
    });
    if (debrief.overall) {
      parts.push("OVERALL COACHING");
      if (debrief.overall.readinessScore) parts.push(`Readiness: ${debrief.overall.readinessScore}`);
      if (debrief.overall.topCoachingNote) parts.push(`Top note: ${debrief.overall.topCoachingNote}`);
      if (debrief.overall.patterns?.length) parts.push(`Patterns: ${debrief.overall.patterns.join("; ")}`);
      if (debrief.overall.beforeYouGo) parts.push(`Before next call: ${debrief.overall.beforeYouGo}`);
    }
    return parts.join("\n");
  }

  function saveAndContinue() {
    onComplete(buildDeliverableText());
  }

  if (phase === "loading" || phase === "debrief_loading") {
    return (
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <LoadingDots />
        <div style={{ fontSize:13, color:"rgba(255,255,255,.3)", fontFamily:"var(--ff-body)", marginTop:8 }}>
          {phase === "loading" ? "Generating your practice interview partners…" : "Analysing your conversations…"}
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:14, color:"rgba(255,255,255,.35)", fontFamily:"var(--ff-body)", marginBottom:12 }}>Something went wrong generating the simulation.</div>
          <button onClick={() => { setPhase("loading"); initRef.current = false; generatePersonas(); }} style={{ padding:"8px 18px", borderRadius:8, border:"1px solid rgba(255,255,255,.1)", background:"transparent", color:"rgba(255,255,255,.5)", fontSize:12, cursor:"pointer", fontFamily:"var(--ff-body)" }}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (phase === "setup" && personas) {
    return (
      <div style={{ flex:1, overflowY:"auto", padding:"32px 40px" }}>
        <div style={{ maxWidth:580, margin:"0 auto" }}>
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:".12em", color:step.color, textTransform:"uppercase", fontFamily:"var(--ff-body)", marginBottom:8 }}>Task 1.sim · Interview Simulation</div>
            <h2 style={{ fontSize:22, fontFamily:"var(--ff-heading)", margin:"0 0 12px", color:"rgba(255,255,255,.9)", fontWeight:400 }}>
              Practice before you go live
            </h2>
            <p style={{ fontSize:14, lineHeight:1.75, color:"rgba(255,255,255,.42)", margin:0 }}>
              You're about to do two practice discovery calls based on your hypothesis. Each person knows something real about your problem space — but they won't volunteer it. Your job is to ask the right questions and uncover how they actually think about this.
            </p>
          </div>

          <div style={{ padding:"14px 18px", borderRadius:10, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.05)", marginBottom:24 }}>
            <div style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,.2)", letterSpacing:".1em", textTransform:"uppercase", fontFamily:"var(--ff-body)", marginBottom:10 }}>Ground rules</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                "You only know their name and what you're trying to learn — treat it like a cold call",
                "Ask about past behavior and current reality, not hypotheticals or product ideas",
                "They may deflect or push back — that's realistic, work through it",
                "The call ends naturally once the core insight has surfaced",
              ].map((rule, i) => (
                <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                  <div style={{ width:17, height:17, minWidth:17, borderRadius:4, background:`${step.color}15`, border:`1px solid ${step.color}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:step.color, fontFamily:"var(--ff-body)", marginTop:1 }}>{i+1}</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,.45)", lineHeight:1.55, fontFamily:"var(--ff-body)" }}>{rule}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,.2)", letterSpacing:".1em", textTransform:"uppercase", fontFamily:"var(--ff-body)", marginBottom:10 }}>
            Your two practice calls
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:28 }}>
            {personas.map((p, i) => (
              <div key={i} style={{ padding:"16px 20px", borderRadius:12, background:"rgba(255,255,255,.02)", border:`1px solid ${PERSONA_COLORS[i]}22` }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                  <div style={{ width:36, height:36, borderRadius:9, background:`linear-gradient(135deg,${PERSONA_COLORS[i]},${PERSONA_COLORS[i]}99)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"#fff", fontFamily:"var(--ff-heading)", flexShrink:0 }}>
                    {p.name[0]}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,.82)", fontFamily:"var(--ff-body)" }}>{p.name}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,.3)", fontFamily:"var(--ff-body)" }}>{p.role}</div>
                  </div>
                  <div style={{ fontSize:9, padding:"3px 8px", borderRadius:4, background:`${PERSONA_COLORS[i]}15`, color:PERSONA_COLORS[i], fontFamily:"var(--ff-body)", fontWeight:700, letterSpacing:".05em", flexShrink:0 }}>
                    CALL {i + 1}
                  </div>
                </div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,.3)", fontFamily:"var(--ff-body)", lineHeight:1.55 }}>
                  <span style={{ fontWeight:700, color:"rgba(255,255,255,.18)" }}>Your objective: </span>{p.callObjective}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => startInterview(0)}
            style={{ width:"100%", padding:"13px 20px", borderRadius:10, border:"none", background:`linear-gradient(135deg,${PERSONA_COLORS[0]},${PERSONA_COLORS[0]}cc)`, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"var(--ff-body)", boxShadow:`0 4px 20px ${PERSONA_COLORS[0]}30` }}
          >
            Begin Call 1 with {personas[0].name} →
          </button>
        </div>
      </div>
    );
  }

  if (phase === "interview" && personas) {
    const persona = personas[currentPersonaIdx];
    const personaColor = PERSONA_COLORS[currentPersonaIdx];

    return (
      <div style={{ flex:1, display:"flex", flexDirection:"column", height:"100vh" }}>
        <div style={{ padding:"10px 20px", borderBottom:"1px solid rgba(255,255,255,.05)", background:"rgba(255,255,255,.012)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, minWidth:32, borderRadius:8, background:`linear-gradient(135deg,${personaColor},${personaColor}99)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#fff", fontFamily:"var(--ff-heading)" }}>
              {persona.name[0]}
            </div>
            <div>
              <div style={{ fontSize:9, fontWeight:700, letterSpacing:".1em", color:personaColor, fontFamily:"var(--ff-body)", textTransform:"uppercase" }}>
                Call {currentPersonaIdx + 1} of 2 · Live Simulation
              </div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,.8)", fontFamily:"var(--ff-heading)" }}>
                {persona.name} — {persona.role}
              </div>
            </div>
          </div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,.22)", fontFamily:"var(--ff-body)", textAlign:"right", maxWidth:240, lineHeight:1.45 }}>
            <span style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,.12)", letterSpacing:".08em", display:"block", textTransform:"uppercase", marginBottom:2 }}>Your objective</span>
            {persona.callObjective}
          </div>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"12px 20px 8px" }}>
          <div style={{ maxWidth:660, margin:"0 auto" }}>
            {currentMessages.map((m, i) => (
              <SimChatBubble key={i} role={m.role} content={m.content} personaInitial={persona.name[0]} personaColor={personaColor} />
            ))}
            {loading && (
              <div style={{ display:"flex", gap:5, padding:"10px 0 10px 42px", alignItems:"center" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:personaColor, opacity:.35, animation:`ffBounce 1.4s ${i*.15}s infinite` }} />
                ))}
              </div>
            )}
            {interviewWrapped && (
              <div style={{ margin:"20px 0", padding:"16px 20px", borderRadius:10, background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.05)", textAlign:"center" }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.2)", fontFamily:"var(--ff-body)", marginBottom:12 }}>— Call ended —</div>
                <button
                  onClick={continueAfterInterview}
                  style={{ padding:"10px 22px", borderRadius:8, border:"none", background:`linear-gradient(135deg,${currentPersonaIdx===0?PERSONA_COLORS[1]:step.color},${currentPersonaIdx===0?PERSONA_COLORS[1]:step.color}cc)`, color:"#fff", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"var(--ff-body)" }}
                >
                  {currentPersonaIdx === 0 ? `Begin Call 2 with ${personas[1].name} →` : "Get Your Debrief →"}
                </button>
              </div>
            )}
            <div ref={btmRef} />
          </div>
        </div>

        {!interviewWrapped && (
          <div style={{ padding:"10px 20px 12px", borderTop:"1px solid rgba(255,255,255,.04)", background:"rgba(255,255,255,.008)" }}>
            <div style={{ maxWidth:660, margin:"0 auto", display:"flex", gap:8, alignItems:"flex-end" }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={loading ? `${persona.name} is responding…` : "Ask your question… (Enter to send)"}
                disabled={loading}
                rows={2}
                style={{ flex:1, padding:"10px 14px", borderRadius:9, border:`1px solid ${personaColor}25`, background:"rgba(255,255,255,.02)", color:"rgba(255,255,255,.9)", fontSize:13.5, lineHeight:1.6, resize:"none", outline:"none", fontFamily:"var(--ff-body)", opacity:loading?0.55:1 }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                style={{ padding:"10px 16px", borderRadius:9, border:"none", background:input.trim()&&!loading?`linear-gradient(135deg,${personaColor},${personaColor}cc)`:"rgba(255,255,255,.03)", color:input.trim()&&!loading?"#fff":"rgba(255,255,255,.12)", fontSize:12, fontWeight:700, cursor:input.trim()&&!loading?"pointer":"not-allowed", fontFamily:"var(--ff-body)", minWidth:56 }}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if ((phase === "debrief" || phase === "debrief_loading") && phase !== "debrief_loading" && debrief) {
    return (
      <div style={{ flex:1, overflowY:"auto", padding:"32px 40px" }}>
        <div style={{ maxWidth:620, margin:"0 auto" }}>
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:".12em", color:"#10B981", textTransform:"uppercase", fontFamily:"var(--ff-body)", marginBottom:8 }}>Debrief</div>
            <h2 style={{ fontSize:22, fontFamily:"var(--ff-heading)", margin:"0 0 8px", color:"rgba(255,255,255,.9)", fontWeight:400 }}>
              Here's how you did
            </h2>
            <p style={{ fontSize:13, color:"rgba(255,255,255,.3)", margin:0, fontFamily:"var(--ff-body)" }}>
              Use these insights to sharpen your approach before speaking with real people.
            </p>
          </div>

          {(debrief.interviews || []).map((intv, i) => (
            <div key={i} style={{ marginBottom:16, padding:"18px 20px", borderRadius:12, background:"rgba(255,255,255,.02)", border:`1px solid ${PERSONA_COLORS[i]}20` }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                <div style={{ width:28, height:28, minWidth:28, borderRadius:7, background:`linear-gradient(135deg,${PERSONA_COLORS[i]},${PERSONA_COLORS[i]}99)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:"#fff", fontFamily:"var(--ff-heading)" }}>
                  {(intv.personaName || personas?.[i]?.name || "?")[0]}
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,.7)", fontFamily:"var(--ff-body)" }}>
                  Call {i + 1}: {intv.personaName || personas?.[i]?.name}
                </div>
                <div style={{ marginLeft:"auto", fontSize:10, padding:"3px 9px", borderRadius:5, background:intv.keySignalFound?"rgba(16,185,129,.1)":"rgba(239,68,68,.07)", color:intv.keySignalFound?"#10B981":"#FCA5A5", fontFamily:"var(--ff-body)", fontWeight:700, flexShrink:0 }}>
                  {intv.keySignalFound ? "✓ Signal found" : "Signal missed"}
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom: intv.keySignalNote ? 10 : 0 }}>
                <div style={{ padding:"10px 12px", borderRadius:8, background:"rgba(16,185,129,.03)", border:"1px solid rgba(16,185,129,.08)" }}>
                  <div style={{ fontSize:9, fontWeight:700, color:"#10B981", letterSpacing:".08em", textTransform:"uppercase", fontFamily:"var(--ff-body)", marginBottom:6 }}>What worked</div>
                  {(intv.whatWorked || []).map((item, j) => (
                    <div key={j} style={{ fontSize:12, color:"rgba(255,255,255,.45)", lineHeight:1.55, fontFamily:"var(--ff-body)", marginBottom:4 }}>· {item}</div>
                  ))}
                </div>
                <div style={{ padding:"10px 12px", borderRadius:8, background:"rgba(239,68,68,.02)", border:"1px solid rgba(239,68,68,.08)" }}>
                  <div style={{ fontSize:9, fontWeight:700, color:"#FCA5A5", letterSpacing:".08em", textTransform:"uppercase", fontFamily:"var(--ff-body)", marginBottom:6 }}>To sharpen</div>
                  {(intv.whatMissed || []).map((item, j) => (
                    <div key={j} style={{ fontSize:12, color:"rgba(255,255,255,.45)", lineHeight:1.55, fontFamily:"var(--ff-body)", marginBottom:4 }}>· {item}</div>
                  ))}
                </div>
              </div>

              {intv.keySignalNote && (
                <div style={{ marginTop:10, padding:"8px 12px", borderRadius:7, background:"rgba(255,255,255,.018)", border:"1px solid rgba(255,255,255,.04)", fontSize:12, color:"rgba(255,255,255,.28)", lineHeight:1.55, fontFamily:"var(--ff-body)" }}>
                  <span style={{ fontWeight:700, color:"rgba(255,255,255,.2)" }}>Key signal: </span>{intv.keySignalNote}
                </div>
              )}
            </div>
          ))}

          {debrief.overall && (
            <div style={{ marginBottom:24, padding:"20px", borderRadius:12, background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.06)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,.7)", fontFamily:"var(--ff-body)" }}>Overall coaching</div>
                {debrief.overall.readinessScore && (
                  <div style={{ padding:"4px 10px", borderRadius:6, background:"rgba(232,85,58,.08)", border:"1px solid rgba(232,85,58,.15)", fontSize:11, fontWeight:700, color:"#E8553A", fontFamily:"var(--ff-body)" }}>
                    Readiness: {debrief.overall.readinessScore}
                  </div>
                )}
              </div>

              {debrief.overall.patterns?.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:9, fontWeight:700, color:"rgba(255,255,255,.18)", letterSpacing:".08em", textTransform:"uppercase", fontFamily:"var(--ff-body)", marginBottom:6 }}>Patterns across both calls</div>
                  {debrief.overall.patterns.map((p, i) => (
                    <div key={i} style={{ fontSize:12, color:"rgba(255,255,255,.42)", lineHeight:1.55, fontFamily:"var(--ff-body)", marginBottom:4 }}>· {p}</div>
                  ))}
                </div>
              )}

              {debrief.overall.topCoachingNote && (
                <div style={{ padding:"12px 14px", borderRadius:8, background:"rgba(232,85,58,.04)", border:"1px solid rgba(232,85,58,.1)", marginBottom:12 }}>
                  <div style={{ fontSize:9, fontWeight:700, color:"#E8553A", letterSpacing:".08em", textTransform:"uppercase", fontFamily:"var(--ff-body)", marginBottom:4 }}>Top coaching note</div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,.6)", lineHeight:1.65, fontFamily:"var(--ff-body)" }}>{debrief.overall.topCoachingNote}</div>
                </div>
              )}

              {debrief.overall.readinessNote && (
                <div style={{ fontSize:12, color:"rgba(255,255,255,.32)", lineHeight:1.55, fontFamily:"var(--ff-body)", marginBottom: debrief.overall.beforeYouGo ? 12 : 0 }}>
                  {debrief.overall.readinessNote}
                </div>
              )}

              {debrief.overall.beforeYouGo && (
                <div style={{ padding:"10px 14px", borderRadius:8, background:"rgba(13,148,136,.04)", border:"1px solid rgba(13,148,136,.12)" }}>
                  <div style={{ fontSize:9, fontWeight:700, color:"#0D9488", letterSpacing:".08em", textTransform:"uppercase", fontFamily:"var(--ff-body)", marginBottom:4 }}>Before your next real call</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,.45)", lineHeight:1.6, fontFamily:"var(--ff-body)" }}>{debrief.overall.beforeYouGo}</div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={saveAndContinue}
            style={{ width:"100%", padding:"13px 20px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#E8553A,#BE185D)", color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"var(--ff-body)", boxShadow:"0 4px 24px rgba(232,85,58,.25)" }}
          >
            Save debrief & continue to Interview Targets →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <LoadingDots />
    </div>
  );
}

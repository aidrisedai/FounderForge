"use client";
import { useState, useEffect, useRef } from "react";

// ── URL safety helpers (defense against javascript:/data: injection) ───────────
function safeHttpsUrl(input) {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function safeLinkedInUrl(input) {
  const url = safeHttpsUrl(input);
  if (!url) return null;
  const host = (() => { try { return new URL(url).hostname.toLowerCase(); } catch { return ""; } })();
  if (!host.endsWith("linkedin.com")) return null;
  return url;
}

// Accepts "@handle", "handle", or full twitter/x URLs. Returns canonical handle or null.
function extractTwitterHandle(input) {
  if (!input || typeof input !== "string") return null;
  let val = input.trim().replace(/^@/, "");
  if (!val) return null;
  // If it's a URL, pull out the path
  const m = val.match(/^https?:\/\/(?:www\.)?(?:twitter|x)\.com\/([A-Za-z0-9_]{1,15})\/?/i);
  if (m) val = m[1];
  // Otherwise must match handle rules
  if (!/^[A-Za-z0-9_]{1,15}$/.test(val)) return null;
  return val;
}

const STEP_LABELS = {
  1: "Discover", 2: "Define", 3: "Develop",
  4: "Deploy", 5: "Deepen", 6: "Dominate", 7: "Promote",
};
const STEP_COLORS = {
  1: "#E8553A", 2: "#F59E0B", 3: "#10B981",
  4: "#3B82F6", 5: "#8B5CF6", 6: "#EC4899", 7: "#06B6D4",
};
const accent = "#E8553A";
const dim = "rgba(255,255,255,.35)";
const dimmer = "rgba(255,255,255,.15)";
const card = "rgba(255,255,255,.03)";
const border = "rgba(255,255,255,.06)";

// ── Helpers ──────────────────────────────────────────────────────────────────

function Avatar({ src, name, size = 36 }) {
  const initials = (name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return src ? (
    <img src={src} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg,#E8553A,#BE185D)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function Tag({ label, color = accent }) {
  return (
    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".08em", padding: "2px 6px", borderRadius: 4, background: `${color}15`, color, border: `1px solid ${color}25`, fontFamily: "var(--ff-body)", textTransform: "uppercase" }}>
      {label}
    </span>
  );
}

function Btn({ children, onClick, variant = "ghost", disabled = false, style: extra = {} }) {
  const base = { fontSize: 11, fontWeight: 600, fontFamily: "var(--ff-body)", borderRadius: 7, cursor: disabled ? "not-allowed" : "pointer", border: "none", transition: "opacity .15s", opacity: disabled ? 0.4 : 1, ...extra };
  const variants = {
    primary: { padding: "7px 14px", background: `linear-gradient(135deg,${accent},#BE185D)`, color: "#fff" },
    ghost: { padding: "6px 12px", background: card, border: `1px solid ${border}`, color: dim },
    danger: { padding: "6px 12px", background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.15)", color: "rgba(239,68,68,.8)" },
  };
  return <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant] }}>{children}</button>;
}

// ── Profile Setup Modal ───────────────────────────────────────────────────────

function ProfileSetupModal({ existing, onSave, onClose }) {
  const [bio, setBio] = useState(existing?.bio || "");
  const [linkedIn, setLinkedIn] = useState(existing?.linkedIn || "");
  const [twitter, setTwitter] = useState(existing?.twitter || "");
  const [website, setWebsite] = useState(existing?.website || "");
  const [lookingFor, setLookingFor] = useState(existing?.lookingFor || []);
  const [saving, setSaving] = useState(false);

  const options = ["peer", "co-founder", "advisor", "investor"];

  function toggle(opt) {
    setLookingFor((prev) => prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]);
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/community/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bio, linkedIn, twitter, website, openToConnect: true, lookingFor }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.profile) onSave(data.profile);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 440, background: "#111113", border: `1px solid ${border}`, borderRadius: 16, padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div style={{ fontSize: 17, fontFamily: "var(--ff-heading)", fontWeight: 700, marginBottom: 4 }}>Set up your community profile</div>
          <div style={{ fontSize: 12, color: dim }}>Let other founders discover and connect with you.</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: dimmer, letterSpacing: ".08em", fontFamily: "var(--ff-body)", textTransform: "uppercase" }}>Short bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value.slice(0, 1000))} rows={3} maxLength={1000} placeholder="Tell other founders about you and what you're building..."
            style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${border}`, background: card, color: "rgba(255,255,255,.85)", fontSize: 13, fontFamily: "var(--ff-body)", resize: "vertical", outline: "none" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[["LinkedIn URL", linkedIn, setLinkedIn], ["Twitter / X handle", twitter, setTwitter], ["Website", website, setWebsite]].map(([label, val, set]) => (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: dimmer, letterSpacing: ".08em", fontFamily: "var(--ff-body)", textTransform: "uppercase" }}>{label}</label>
              <input value={val} onChange={(e) => set(e.target.value)} placeholder={label}
                style={{ padding: "8px 10px", borderRadius: 7, border: `1px solid ${border}`, background: card, color: "rgba(255,255,255,.85)", fontSize: 12, fontFamily: "var(--ff-body)", outline: "none" }} />
            </div>
          ))}
        </div>

        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: dimmer, letterSpacing: ".08em", fontFamily: "var(--ff-body)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>I'm looking for</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {options.map((opt) => (
              <button key={opt} onClick={() => toggle(opt)} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600, fontFamily: "var(--ff-body)", cursor: "pointer", border: `1px solid ${lookingFor.includes(opt) ? accent : border}`, background: lookingFor.includes(opt) ? `${accent}15` : card, color: lookingFor.includes(opt) ? accent : dim, transition: "all .15s" }}>
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save Profile"}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Founder Card ──────────────────────────────────────────────────────────────

function FounderCard({ founder, onMessage }) {
  const [connecting, setConnecting] = useState(false);
  const [localStatus, setLocalStatus] = useState(founder.connectionStatus);
  const [introMsg, setIntroMsg] = useState("");
  const [showIntro, setShowIntro] = useState(false);

  async function handleConnect() {
    if (showIntro) {
      setConnecting(true);
      const res = await fetch("/api/community/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: founder.id, message: introMsg }),
      });
      const data = await res.json();
      setConnecting(false);
      if (data.connection) { setLocalStatus("PENDING"); setShowIntro(false); }
    } else {
      setShowIntro(true);
    }
  }

  const btnLabel = {
    PENDING: founder.iRequested ? "Pending…" : "Respond",
    ACCEPTED: "Message",
    DECLINED: "Declined",
  }[localStatus] || "Connect";

  function handleBtnClick() {
    if (localStatus === "ACCEPTED") return onMessage(founder);
    if (!localStatus || localStatus === "DECLINED") handleConnect();
  }

  // Show up to 3 project rows; collapse the rest
  const projects = founder.projectStages || [];
  const visibleProjects = projects.slice(0, 3);
  const hiddenCount = projects.length - visibleProjects.length;

  return (
    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header: avatar + name + level */}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <Avatar src={founder.image} name={founder.name} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--ff-heading)", color: "rgba(255,255,255,.9)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{founder.name}</div>
          {founder.stats?.level && (
            <div style={{ marginTop: 3 }}>
              <Tag label={`Lvl ${founder.stats.level}`} color="#8B5CF6" />
            </div>
          )}
        </div>
      </div>

      {/* Projects: one row per project showing name + active step */}
      {visibleProjects.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {visibleProjects.map((p) => {
            const color = STEP_COLORS[p.activeStep] || accent;
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,.6)", fontFamily: "var(--ff-body)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                <Tag label={`Step ${p.activeStep}: ${STEP_LABELS[p.activeStep] || "?"}`} color={color} />
              </div>
            );
          })}
          {hiddenCount > 0 && (
            <div style={{ fontSize: 10, color: dimmer, fontFamily: "var(--ff-body)" }}>+{hiddenCount} more project{hiddenCount > 1 ? "s" : ""}</div>
          )}
        </div>
      )}

      {founder.profile?.bio && (
        <div style={{ fontSize: 11.5, color: dim, lineHeight: 1.6, fontFamily: "var(--ff-body)" }}>
          {founder.profile.bio.length > 140 ? founder.profile.bio.slice(0, 140) + "…" : founder.profile.bio}
        </div>
      )}

      {founder.profile?.lookingFor?.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {founder.profile.lookingFor.map((lf) => (
            <Tag key={lf} label={`seeking ${lf}`} color="#10B981" />
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {(() => {
          const url = safeLinkedInUrl(founder.profile?.linkedIn);
          return url ? <a href={url} target="_blank" rel="noreferrer noopener" style={{ fontSize: 10, color: "#0A66C2", fontFamily: "var(--ff-body)", fontWeight: 600, textDecoration: "none", padding: "4px 8px", borderRadius: 5, background: "rgba(10,102,194,.08)", border: "1px solid rgba(10,102,194,.2)" }}>LinkedIn ↗</a> : null;
        })()}
        {(() => {
          const handle = extractTwitterHandle(founder.profile?.twitter);
          return handle ? <a href={`https://twitter.com/${handle}`} target="_blank" rel="noreferrer noopener" style={{ fontSize: 10, color: "#1DA1F2", fontFamily: "var(--ff-body)", fontWeight: 600, textDecoration: "none", padding: "4px 8px", borderRadius: 5, background: "rgba(29,161,242,.08)", border: "1px solid rgba(29,161,242,.2)" }}>Twitter ↗</a> : null;
        })()}
        <div style={{ flex: 1 }} />
        <Btn variant={localStatus === "ACCEPTED" ? "primary" : "ghost"} onClick={handleBtnClick} disabled={connecting || localStatus === "DECLINED" || (localStatus === "PENDING" && founder.iRequested)}>
          {connecting ? "…" : btnLabel}
        </Btn>
      </div>

      {showIntro && !localStatus && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <textarea value={introMsg} onChange={(e) => setIntroMsg(e.target.value.slice(0, 500))} rows={2} maxLength={500} placeholder="Add a short intro message (optional)…"
            style={{ padding: "8px 10px", borderRadius: 7, border: `1px solid ${border}`, background: "rgba(255,255,255,.02)", color: "rgba(255,255,255,.8)", fontSize: 12, fontFamily: "var(--ff-body)", resize: "none", outline: "none" }} />
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <Btn onClick={() => setShowIntro(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleConnect} disabled={connecting}>{connecting ? "Sending…" : "Send Request"}</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Discover Sub-tab ──────────────────────────────────────────────────────────

function DiscoverTab({ myProfile, onSetupProfile, onMessage }) {
  const [founders, setFounders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stepFilter, setStepFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const qs = stepFilter ? `?step=${stepFilter}` : "";
    fetch(`/api/community/founders${qs}`)
      .then((r) => r.json())
      .then((d) => { setFounders(d.founders || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [stepFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {!myProfile && (
        <div style={{ padding: "14px 16px", borderRadius: 10, background: `${accent}08`, border: `1px solid ${accent}20`, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--ff-heading)", color: "rgba(255,255,255,.9)", marginBottom: 3 }}>You're invisible to other founders</div>
            <div style={{ fontSize: 11, color: dim, fontFamily: "var(--ff-body)" }}>Set up your community profile so others can discover and connect with you.</div>
          </div>
          <Btn variant="primary" onClick={onSetupProfile}>Set up profile →</Btn>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: dimmer, fontFamily: "var(--ff-body)", letterSpacing: ".08em", textTransform: "uppercase" }}>Filter by stage:</span>
        {["", "1", "2", "3", "4", "5", "6", "7"].map((s) => (
          <button key={s} onClick={() => setStepFilter(s)} style={{ padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 600, fontFamily: "var(--ff-body)", cursor: "pointer", border: `1px solid ${stepFilter === s ? accent : border}`, background: stepFilter === s ? `${accent}15` : card, color: stepFilter === s ? accent : dim, transition: "all .15s" }}>
            {s === "" ? "All" : `Step ${s}`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: dimmer, fontSize: 12, fontFamily: "var(--ff-body)" }}>Loading founders…</div>
      ) : founders.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: dimmer, fontSize: 12, fontFamily: "var(--ff-body)" }}>
          No founders found{stepFilter ? ` at Step ${stepFilter}` : ""}. Be the first to set up a community profile!
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
          {founders.map((f) => (
            <FounderCard key={f.id} founder={f} onMessage={onMessage} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Connections Sub-tab ───────────────────────────────────────────────────────

function ConnectionsTab({ onMessage }) {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch("/api/community/connections")
      .then((r) => r.json())
      .then((d) => { setConnections(d.connections || []); setLoading(false); })
      .catch(() => setLoading(false));
  }
  useEffect(load, []);

  async function respond(id, action) {
    await fetch(`/api/community/connections/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load();
  }

  const pending = connections.filter((c) => c.status === "PENDING" && c.direction === "received");
  const accepted = connections.filter((c) => c.status === "ACCEPTED");
  const sentPending = connections.filter((c) => c.status === "PENDING" && c.direction === "sent");

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: dimmer, fontSize: 12, fontFamily: "var(--ff-body)" }}>Loading…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {pending.length > 0 && (
        <section>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", color: accent, fontFamily: "var(--ff-body)", textTransform: "uppercase", marginBottom: 10 }}>Requests ({pending.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pending.map((c) => (
              <div key={c.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 10, padding: 14, display: "flex", gap: 12, alignItems: "center" }}>
                <Avatar src={c.otherUser.image} name={c.otherUser.name} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--ff-heading)", color: "rgba(255,255,255,.9)" }}>{c.otherUser.name}</div>
                  {c.message && <div style={{ fontSize: 11, color: dim, fontFamily: "var(--ff-body)", marginTop: 2, lineHeight: 1.4 }}>"{c.message}"</div>}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn variant="danger" onClick={() => respond(c.id, "decline")}>Decline</Btn>
                  <Btn variant="primary" onClick={() => respond(c.id, "accept")}>Accept</Btn>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {accepted.length > 0 && (
        <section>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", color: dimmer, fontFamily: "var(--ff-body)", textTransform: "uppercase", marginBottom: 10 }}>Your Network ({accepted.length})</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 8 }}>
            {accepted.map((c) => (
              <div key={c.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 10, padding: 14, display: "flex", gap: 10, alignItems: "center" }}>
                <Avatar src={c.otherUser.image} name={c.otherUser.name} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--ff-heading)", color: "rgba(255,255,255,.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.otherUser.name}</div>
                  <div style={{ fontSize: 10, color: dimmer, fontFamily: "var(--ff-body)", marginTop: 1 }}>{c.otherUser.projects?.[0]?.name || "—"}</div>
                </div>
                <Btn variant="primary" onClick={() => onMessage(c.otherUser)}>Chat</Btn>
              </div>
            ))}
          </div>
        </section>
      )}

      {sentPending.length > 0 && (
        <section>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", color: dimmer, fontFamily: "var(--ff-body)", textTransform: "uppercase", marginBottom: 10 }}>Sent & Awaiting ({sentPending.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {sentPending.map((c) => (
              <div key={c.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 10, padding: 12, display: "flex", gap: 10, alignItems: "center" }}>
                <Avatar src={c.otherUser.image} name={c.otherUser.name} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--ff-heading)", color: "rgba(255,255,255,.7)" }}>{c.otherUser.name}</div>
                </div>
                <span style={{ fontSize: 10, color: "#F59E0B", fontFamily: "var(--ff-body)", fontWeight: 600 }}>Pending</span>
                <Btn variant="danger" onClick={() => respond(c.id, "withdraw")}>Withdraw</Btn>
              </div>
            ))}
          </div>
        </section>
      )}

      {connections.length === 0 && (
        <div style={{ textAlign: "center", padding: 48, color: dimmer, fontSize: 13, fontFamily: "var(--ff-body)" }}>
          No connections yet — head to Discover to find other founders.
        </div>
      )}
    </div>
  );
}

// ── Messages Sub-tab ──────────────────────────────────────────────────────────

function MessagesTab({ openThread }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(openThread || null);
  const [conv, setConv] = useState([]);
  const [myId, setMyId] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState(null);
  const btmRef = useRef(null);

  useEffect(() => {
    fetch("/api/community/messages")
      .then((r) => r.json())
      .then((d) => { setThreads(d.threads || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (openThread) openConv(openThread);
  }, [openThread]);

  function openConv(user) {
    setActive(user);
    setOtherUser(user);
    setConv([]);
    fetch(`/api/community/messages/${user.id}`)
      .then((r) => r.json())
      .then((d) => {
        setConv(d.messages || []);
        setMyId(d.myId);
        setOtherUser(d.otherUser || user);
        setTimeout(() => btmRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      });
  }

  async function send() {
    if (!draft.trim() || !active) return;
    setSending(true);
    const res = await fetch(`/api/community/messages/${active.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft }),
    });
    const data = await res.json();
    setSending(false);
    if (data.message) {
      setConv((prev) => [...prev, data.message]);
      setDraft("");
      setTimeout(() => btmRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  if (active) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0 14px", borderBottom: `1px solid ${border}` }}>
          <button onClick={() => setActive(null)} style={{ background: "none", border: "none", color: dim, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px" }}>←</button>
          <Avatar src={otherUser?.image} name={otherUser?.name} size={30} />
          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--ff-heading)", color: "rgba(255,255,255,.9)" }}>{otherUser?.name}</div>
          {(() => {
            const url = safeLinkedInUrl(otherUser?.founderProfile?.linkedIn);
            return url ? <a href={url} target="_blank" rel="noreferrer noopener" style={{ fontSize: 10, color: "#0A66C2", fontFamily: "var(--ff-body)", fontWeight: 600, textDecoration: "none", marginLeft: "auto", padding: "3px 8px", borderRadius: 4, background: "rgba(10,102,194,.08)", border: "1px solid rgba(10,102,194,.2)" }}>LinkedIn ↗</a> : null;
          })()}
          {(() => {
            const handle = extractTwitterHandle(otherUser?.founderProfile?.twitter);
            return handle ? <a href={`https://twitter.com/${handle}`} target="_blank" rel="noreferrer noopener" style={{ fontSize: 10, color: "#1DA1F2", fontFamily: "var(--ff-body)", fontWeight: 600, textDecoration: "none", padding: "3px 8px", borderRadius: 4, background: "rgba(29,161,242,.08)", border: "1px solid rgba(29,161,242,.2)" }}>Twitter ↗</a> : null;
          })()}
        </div>

        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, padding: "14px 0" }}>
          {conv.map((m) => {
            const mine = m.senderId === myId;
            return (
              <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "72%", padding: "9px 13px", borderRadius: 12, borderBottomRightRadius: mine ? 3 : 12, borderBottomLeftRadius: mine ? 12 : 3, background: mine ? `${accent}18` : card, border: `1px solid ${mine ? `${accent}25` : border}`, fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,.85)", fontFamily: "var(--ff-body)" }}>
                  {m.content}
                </div>
              </div>
            );
          })}
          {conv.length === 0 && <div style={{ textAlign: "center", color: dimmer, fontSize: 12, fontFamily: "var(--ff-body)", padding: 24 }}>No messages yet. Say hello!</div>}
          <div ref={btmRef} />
        </div>

        <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: `1px solid ${border}` }}>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value.slice(0, 4000))} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} rows={2} maxLength={4000} placeholder="Write a message… (Enter to send)"
            style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: `1px solid ${border}`, background: card, color: "rgba(255,255,255,.85)", fontSize: 13, fontFamily: "var(--ff-body)", resize: "none", outline: "none" }} />
          <button onClick={send} disabled={!draft.trim() || sending} style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: draft.trim() && !sending ? `linear-gradient(135deg,${accent},#BE185D)` : "rgba(255,255,255,.03)", color: draft.trim() && !sending ? "#fff" : dimmer, fontSize: 12, fontWeight: 600, cursor: draft.trim() && !sending ? "pointer" : "not-allowed", fontFamily: "var(--ff-body)" }}>Send</button>
        </div>
      </div>
    );
  }

  if (loading) return <div style={{ textAlign: "center", padding: 40, color: dimmer, fontSize: 12, fontFamily: "var(--ff-body)" }}>Loading…</div>;

  if (threads.length === 0) {
    return <div style={{ textAlign: "center", padding: 48, color: dimmer, fontSize: 13, fontFamily: "var(--ff-body)" }}>No messages yet. Connect with a founder and start a conversation.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {threads.map((t) => (
        <button key={t.otherUser.id} onClick={() => openConv(t.otherUser)} style={{ display: "flex", gap: 12, alignItems: "center", padding: 14, borderRadius: 10, background: card, border: `1px solid ${border}`, cursor: "pointer", textAlign: "left", transition: "background .15s" }}>
          <Avatar src={t.otherUser.image} name={t.otherUser.name} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--ff-heading)", color: "rgba(255,255,255,.9)" }}>{t.otherUser.name}</span>
              {t.unread > 0 && <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 10, background: accent, color: "#fff" }}>{t.unread}</span>}
            </div>
            <div style={{ fontSize: 11, color: dim, fontFamily: "var(--ff-body)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {t.lastMessage?.content || "—"}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Main CommunityTab ─────────────────────────────────────────────────────────

export default function CommunityTab({ session }) {
  const [activeTab, setActiveTab] = useState("discover");
  const [myProfile, setMyProfile] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [messageTarget, setMessageTarget] = useState(null);

  useEffect(() => {
    fetch("/api/community/profile")
      .then((r) => r.json())
      .then((d) => { setMyProfile(d.profile); setProfileLoaded(true); })
      .catch(() => setProfileLoaded(true));
  }, []);

  function handleMessage(user) {
    setMessageTarget(user);
    setActiveTab("messages");
  }

  const tabs = [
    { id: "discover", label: "Discover" },
    { id: "connections", label: "Connections" },
    { id: "messages", label: "Messages" },
  ];

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", minWidth: 0, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "14px 24px 0", borderBottom: `1px solid ${border}`, background: "rgba(255,255,255,.012)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontFamily: "var(--ff-heading)", fontWeight: 700, color: "rgba(255,255,255,.9)" }}>Community</div>
            <div style={{ fontSize: 11, color: dim, fontFamily: "var(--ff-body)", marginTop: 2 }}>Connect with founders building alongside you</div>
          </div>
          {profileLoaded && (
            <button onClick={() => setShowSetup(true)} style={{ fontSize: 11, fontWeight: 600, fontFamily: "var(--ff-body)", padding: "6px 12px", borderRadius: 7, border: `1px solid ${border}`, background: card, color: myProfile ? dim : accent, cursor: "pointer" }}>
              {myProfile ? "Edit my profile" : "Set up profile →"}
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => { setActiveTab(t.id); if (t.id !== "messages") setMessageTarget(null); }} style={{ padding: "7px 14px", borderRadius: "6px 6px 0 0", fontSize: 12, fontWeight: 600, fontFamily: "var(--ff-body)", cursor: "pointer", border: "none", background: activeTab === t.id ? "rgba(255,255,255,.04)" : "transparent", color: activeTab === t.id ? "rgba(255,255,255,.9)" : dim, borderBottom: activeTab === t.id ? `2px solid ${accent}` : "2px solid transparent" }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        {activeTab === "discover" && <DiscoverTab myProfile={myProfile} onSetupProfile={() => setShowSetup(true)} onMessage={handleMessage} />}
        {activeTab === "connections" && <ConnectionsTab onMessage={handleMessage} />}
        {activeTab === "messages" && <MessagesTab key={messageTarget?.id} openThread={messageTarget} />}
      </div>

      {showSetup && (
        <ProfileSetupModal
          existing={myProfile}
          onSave={(p) => { setMyProfile(p); setShowSetup(false); }}
          onClose={() => setShowSetup(false)}
        />
      )}
    </div>
  );
}

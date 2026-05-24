"use client";
import { useState, useEffect, useRef, useCallback } from "react";

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

function DomainBrowser({ onSelect }) {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/discovery/domains")
      .then((r) => r.json())
      .then((d) => { setDomains(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>Loading domains…</div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
        <h2 style={{ fontFamily: "var(--ff-head)", fontSize: 28, fontWeight: 700, color: "#111827", margin: "0 0 12px" }}>
          Find Your Problem Space
        </h2>
        <p style={{ color: "#6b7280", fontSize: 16, maxWidth: 520, margin: "0 auto" }}>
          Pick a domain to explore. Watch curated videos, see real pain points, and capture the problems that resonate with you.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {domains.map((d) => (
          <button
            key={d.id}
            onClick={() => onSelect(d)}
            style={{
              background: "#fff",
              border: "1.5px solid #e5e7eb",
              borderRadius: 12,
              padding: "20px 18px",
              textAlign: "left",
              cursor: "pointer",
              transition: "all .15s",
              fontFamily: "var(--ff-body)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,.12)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>{d.icon}</div>
            <div style={{ fontWeight: 700, color: "#111827", fontSize: 15, marginBottom: 4 }}>{d.name}</div>
            <div style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.4 }}>{d.description}</div>
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
          ← All domains
        </button>
        <span style={{ color: "#d1d5db" }}>|</span>
        <span style={{ fontSize: 22 }}>{domain.icon}</span>
        <h2 style={{ fontFamily: "var(--ff-head)", fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>{domain.name}</h2>
        <button
          onClick={() => loadVideos(true)}
          disabled={refreshing}
          title="Search YouTube for more videos"
          style={{ marginLeft: "auto", background: "none", border: "1px solid #e5e7eb", borderRadius: 8, padding: "5px 12px", fontSize: 12, color: "#6b7280", cursor: "pointer", fontFamily: "var(--ff-body)", opacity: refreshing ? 0.5 : 1 }}
        >
          {refreshing ? "Searching…" : "↻ Refresh videos"}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>Loading videos…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 18 }}>
          {(data?.videos || []).map((v) => (
            <div
              key={v.id}
              onClick={() => onSelectVideo(v, domain)}
              style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "all .15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(99,102,241,.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "none"; }}
            >
              {v.thumbnailUrl ? (
                <div style={{ position: "relative", paddingTop: "56.25%", background: "#f3f4f6" }}>
                  <img src={v.thumbnailUrl} alt={v.title} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 44, height: 44, background: "rgba(0,0,0,.65)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "#fff", fontSize: 16, marginLeft: 3 }}>▶</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ height: 140, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>▶</div>
              )}
              <div style={{ padding: "12px 14px 14px" }}>
                <div style={{ fontWeight: 600, color: "#111827", fontSize: 14, lineHeight: 1.4, marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{v.title}</div>
                <div style={{ color: "#9ca3af", fontSize: 12 }}>{v.channelTitle}</div>
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
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 12 }}>
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
          <h3 style={{ fontFamily: "var(--ff-head)", fontSize: 18, fontWeight: 700, color: "#111827", margin: "14px 0 4px" }}>{video.title}</h3>
          <p style={{ color: "#9ca3af", fontSize: 13, margin: 0 }}>{video.channelTitle}</p>
        </div>
      </div>

      {/* Right: AI sidebar */}
      <div style={{ width: 360, borderLeft: "1px solid #e5e7eb", display: "flex", flexDirection: "column", background: "#fafafa", flexShrink: 0 }}>
        <div style={{ padding: "16px 18px", borderBottom: "1px solid #e5e7eb", background: "#fff" }}>
          <div style={{ fontWeight: 700, color: "#111827", fontSize: 15, marginBottom: 2 }}>🤖 AI Problem Scout</div>
          <div style={{ color: "#9ca3af", fontSize: 12 }}>Analyzing video for problems worth solving</div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "16px 18px" }}>
          {analyzing ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
              <div style={{ fontSize: 14 }}>Analyzing transcript…</div>
            </div>
          ) : !analysis || analysis.error ? (
            <div style={{ color: "#9ca3af", fontSize: 14, textAlign: "center", paddingTop: 24 }}>
              Could not analyze this video. Try watching and using the capture button below.
            </div>
          ) : (
            <>
              {analysis.domainContext && (
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 12px", marginBottom: 16, fontSize: 13, color: "#1e40af", lineHeight: 1.5 }}>
                  {analysis.domainContext}
                </div>
              )}

              {(analysis.problems || []).length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#374151", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".05em" }}>Problems Surfaced</div>
                  {analysis.problems.map((p, i) => (
                    <div key={i} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#111827", marginBottom: 3 }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.5, marginBottom: 8 }}>{p.description}</div>
                      <button
                        onClick={() => openCapture(p.title + ": " + p.description)}
                        style={{ background: "#f0f4ff", color: "#6366f1", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--ff-body)" }}
                      >
                        💡 Capture this
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {(analysis.questions || []).length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#374151", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".05em" }}>Reflect</div>
                  {analysis.questions.map((q, i) => (
                    <div key={i} style={{ background: "#fff8f0", border: "1px solid #fed7aa", borderRadius: 8, padding: "10px 12px", marginBottom: 8, fontSize: 13, color: "#92400e", lineHeight: 1.5 }}>
                      {q}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ padding: "12px 18px", borderTop: "1px solid #e5e7eb", background: "#fff" }}>
          <button
            onClick={() => openCapture("")}
            style={{ width: "100%", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "10px 0", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "var(--ff-body)" }}
          >
            💡 I see a problem here
          </button>
        </div>
      </div>

      {/* Capture modal */}
      {captureOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setCaptureOpen(false)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: 480, maxWidth: "92vw" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: "var(--ff-head)", fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 6px" }}>Capture a Problem</h3>
            <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 18px" }}>Describe the pain point you see. Be as specific as possible about who feels it and why it matters.</p>
            <textarea
              value={captureText}
              onChange={(e) => setCaptureText(e.target.value)}
              placeholder="e.g. Small clinic owners spend 2+ hours daily on manual insurance pre-authorization calls, delaying patient care and burning out staff…"
              rows={4}
              style={{ width: "100%", border: "1.5px solid #d1d5db", borderRadius: 8, padding: "10px 12px", fontSize: 14, fontFamily: "var(--ff-body)", resize: "vertical", boxSizing: "border-box", outline: "none" }}
            />
            <textarea
              value={captureNotes}
              onChange={(e) => setCaptureNotes(e.target.value)}
              placeholder="Personal notes (optional): Have you seen this? Who do you know that faces this?"
              rows={2}
              style={{ width: "100%", border: "1.5px solid #d1d5db", borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: "var(--ff-body)", resize: "vertical", boxSizing: "border-box", outline: "none", marginTop: 10, color: "#6b7280" }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
              <button onClick={() => setCaptureOpen(false)} style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "var(--ff-body)" }}>Cancel</button>
              <button onClick={saveCapture} disabled={saving || captureText.trim().length < 10} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "var(--ff-body)", opacity: saving ? .6 : 1 }}>
                {saving ? "Saving…" : "Save Problem"}
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
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <h3 style={{ fontFamily: "var(--ff-head)", fontSize: 22, fontWeight: 700, color: "#111827", margin: "0 0 10px" }}>No problems captured yet</h3>
        <p style={{ color: "#6b7280", fontSize: 15, margin: "0 0 24px" }}>Explore domains and watch videos. When you see a problem that resonates, capture it here.</p>
        <button onClick={onBack} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "var(--ff-body)" }}>Explore Domains →</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "var(--ff-head)", fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Your Problem Portfolio</h2>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "#6366f1", fontSize: 14, fontFamily: "var(--ff-body)" }}>← Back to Domains</button>
      </div>

      {ungraduated.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#374151", marginBottom: 12, textTransform: "uppercase", letterSpacing: ".05em" }}>Captured Problems ({ungraduated.length})</div>
          {ungraduated.map((p) => (
            <div key={p.id} style={{ background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: "16px 18px", marginBottom: 12 }}>
              <div style={{ fontSize: 15, color: "#111827", fontWeight: 600, lineHeight: 1.5, marginBottom: p.notes ? 8 : 12 }}>{p.problemText}</div>
              {p.notes && <div style={{ fontSize: 13, color: "#6b7280", fontStyle: "italic", marginBottom: 10, lineHeight: 1.4 }}>{p.notes}</div>}
              {p.video && (
                <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>
                  📹 From: {p.video.title}
                </div>
              )}
              <button
                onClick={() => onGraduate(p.id)}
                disabled={graduating === p.id}
                style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--ff-body)", opacity: graduating === p.id ? .6 : 1 }}
              >
                {graduating === p.id ? "Starting…" : "🚀 Start Building This"}
              </button>
            </div>
          ))}
        </div>
      )}

      {graduated.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#374151", marginBottom: 12, textTransform: "uppercase", letterSpacing: ".05em" }}>Graduated ✓</div>
          {graduated.map((p) => (
            <div key={p.id} style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 12, padding: "14px 18px", marginBottom: 10 }}>
              <div style={{ fontSize: 14, color: "#166534", fontWeight: 600, lineHeight: 1.5 }}>{p.problemText}</div>
              <div style={{ fontSize: 12, color: "#4ade80", marginTop: 6 }}>✓ Project created — building in FounderForge</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Discovery Module (top-level) ─────────────────────────────────────────────

export default function DiscoveryModule({ onGraduate }) {
  const [view, setView] = useState("domains"); // domains | videos | player | portfolio
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [problems, setProblems] = useState([]);
  const [graduating, setGraduating] = useState(null);

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
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#f9fafb" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <span style={{ fontFamily: "var(--ff-head)", fontSize: 18, fontWeight: 700, color: "#111827" }}>🔍 Idea Discovery</span>
          <span style={{ color: "#9ca3af", fontSize: 13, marginLeft: 12 }}>Find your problem space through video</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setView("domains")}
            style={{ background: view === "domains" ? "#6366f1" : "#f3f4f6", color: view === "domains" ? "#fff" : "#374151", border: "none", borderRadius: 8, padding: "7px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "var(--ff-body)" }}
          >
            Domains
          </button>
          <button
            onClick={() => setView("portfolio")}
            style={{ background: view === "portfolio" ? "#6366f1" : "#f3f4f6", color: view === "portfolio" ? "#fff" : "#374151", border: "none", borderRadius: 8, padding: "7px 14px", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "var(--ff-body)", position: "relative" }}
          >
            My Problems
            {portfolioCount > 0 && (
              <span style={{ marginLeft: 6, background: "#ef4444", color: "#fff", borderRadius: 99, padding: "1px 6px", fontSize: 11, fontWeight: 700 }}>{portfolioCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: "auto" }}>
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
            onBack={() => setView("domains")}
          />
        )}
      </div>
    </div>
  );
}

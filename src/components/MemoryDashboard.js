"use client";
import { useState, useEffect } from "react";

export default function MemoryDashboard({ userId, onClose }) {
  const [memory, setMemory] = useState(null);
  const [summary, setSummary] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadMemoryData();
  }, []);

  async function loadMemoryData() {
    try {
      // Fetch memory summary
      const summaryRes = await fetch("/api/memory?action=summary");
      const summaryData = await summaryRes.json();
      setSummary(summaryData.summary);

      // Fetch memory health
      const healthRes = await fetch("/api/memory?action=health");
      const healthData = await healthRes.json();
      setHealth(healthData.health);

      // Fetch full memory for detailed view
      const memoryRes = await fetch("/api/memory");
      const memoryData = await memoryRes.json();
      setMemory(memoryData.memory);
    } catch (error) {
      console.error("Error loading memory:", error);
    }
    setLoading(false);
  }

  async function exportMemory() {
    try {
      const res = await fetch("/api/memory?action=export");
      const data = await res.json();
      
      // Create download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `founderforge_memory_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting memory:", error);
    }
  }

  async function pruneMemory() {
    try {
      await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "prune" })
      });
      await loadMemoryData();
    } catch (error) {
      console.error("Error pruning memory:", error);
    }
  }

  if (loading) {
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
      }}>
        <div style={{ color: "rgba(255,255,255,0.5)" }}>Loading memory...</div>
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.9)",
      zIndex: 1000,
      overflow: "auto"
    }}>
      <div style={{
        maxWidth: 900,
        margin: "40px auto",
        background: "rgba(255,255,255,0.03)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden"
      }}>
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div>
            <h2 style={{ 
              fontSize: 24, 
              fontFamily: "var(--ff-heading)", 
              margin: 0,
              marginBottom: 4
            }}>
              Memory & Insights
            </h2>
            {health && !health.isHealthy && (
              <div style={{ 
                fontSize: 11, 
                color: "#D97706",
                fontFamily: "var(--ff-body)"
              }}>
                ⚠️ {health.suggestions[0]}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "transparent",
              color: "rgba(255,255,255,0.4)",
              cursor: "pointer",
              fontSize: 14,
              fontFamily: "var(--ff-body)"
            }}
          >
            Close
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex",
          gap: 2,
          padding: "0 24px",
          borderBottom: "1px solid rgba(255,255,255,0.05)"
        }}>
          {["overview", "insights", "milestones", "patterns"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "12px 20px",
                background: activeTab === tab ? "rgba(232,85,58,0.1)" : "transparent",
                border: "none",
                borderBottom: activeTab === tab ? "2px solid #E8553A" : "2px solid transparent",
                color: activeTab === tab ? "#E8553A" : "rgba(255,255,255,0.4)",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "var(--ff-body)",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.05em"
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: "24px", minHeight: 400 }}>
          {activeTab === "overview" && summary && (
            <div>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
                marginBottom: 32
              }}>
                <StatCard 
                  label="Active Projects" 
                  value={summary.activeProjects}
                  total={summary.totalProjects}
                />
                <StatCard 
                  label="Insights Captured" 
                  value={summary.totalInsights}
                />
                <StatCard 
                  label="Key Decisions" 
                  value={summary.totalDecisions}
                />
                <StatCard 
                  label="Milestones" 
                  value={summary.totalMilestones}
                />
              </div>

              {summary.recentMilestones.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <h3 style={{ 
                    fontSize: 14, 
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.5)",
                    marginBottom: 12,
                    fontFamily: "var(--ff-body)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em"
                  }}>
                    Recent Achievements
                  </h3>
                  {summary.recentMilestones.map(milestone => (
                    <div key={milestone.id} style={{
                      padding: "12px 16px",
                      background: "rgba(255,255,255,0.02)",
                      borderRadius: 8,
                      marginBottom: 8,
                      border: "1px solid rgba(255,255,255,0.04)"
                    }}>
                      <div style={{ 
                        fontSize: 13, 
                        color: "rgba(255,255,255,0.8)",
                        fontFamily: "var(--ff-body)"
                      }}>
                        ✨ {milestone.milestone}
                      </div>
                      <div style={{ 
                        fontSize: 10, 
                        color: "rgba(255,255,255,0.3)",
                        marginTop: 4,
                        fontFamily: "var(--ff-body)"
                      }}>
                        {new Date(milestone.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "insights" && memory && (
            <div>
              {memory.insights.length === 0 ? (
                <EmptyState message="No insights captured yet. Keep working through tasks!" />
              ) : (
                memory.insights.slice(-10).reverse().map(insight => (
                  <div key={insight.id} style={{
                    padding: "14px 18px",
                    background: insight.importance === "high" 
                      ? "rgba(232,85,58,0.05)" 
                      : "rgba(255,255,255,0.02)",
                    borderRadius: 10,
                    marginBottom: 12,
                    border: insight.importance === "high"
                      ? "1px solid rgba(232,85,58,0.2)"
                      : "1px solid rgba(255,255,255,0.05)"
                  }}>
                    <div style={{ 
                      fontSize: 13, 
                      color: "rgba(255,255,255,0.85)",
                      lineHeight: 1.6,
                      fontFamily: "var(--ff-body)"
                    }}>
                      {insight.content}
                    </div>
                    <div style={{ 
                      fontSize: 10, 
                      color: "rgba(255,255,255,0.3)",
                      marginTop: 6,
                      fontFamily: "var(--ff-body)"
                    }}>
                      {new Date(insight.timestamp).toLocaleString()}
                      {insight.importance === "high" && (
                        <span style={{ color: "#E8553A", marginLeft: 8 }}>
                          • Important
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "milestones" && memory && (
            <div>
              {memory.milestones.length === 0 ? (
                <EmptyState message="No milestones yet. Complete tasks to earn them!" />
              ) : (
                memory.milestones.slice(-15).reverse().map(milestone => (
                  <div key={milestone.id} style={{
                    padding: "12px 16px",
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: 8,
                    marginBottom: 8,
                    border: "1px solid rgba(255,255,255,0.04)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12
                  }}>
                    <div style={{ fontSize: 20 }}>
                      {milestone.celebrated ? "🎉" : "⭐"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: 13, 
                        color: "rgba(255,255,255,0.8)",
                        fontFamily: "var(--ff-body)"
                      }}>
                        {milestone.milestone}
                      </div>
                      <div style={{ 
                        fontSize: 10, 
                        color: "rgba(255,255,255,0.3)",
                        marginTop: 2,
                        fontFamily: "var(--ff-body)"
                      }}>
                        {new Date(milestone.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "patterns" && memory && (
            <div>
              {memory.patterns.stickingPoints?.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <h4 style={{ 
                    fontSize: 12, 
                    color: "#D97706",
                    marginBottom: 12,
                    fontFamily: "var(--ff-body)",
                    fontWeight: 600,
                    textTransform: "uppercase"
                  }}>
                    Common Challenges
                  </h4>
                  {memory.patterns.stickingPoints.map((point, i) => (
                    <div key={i} style={{
                      padding: "10px 14px",
                      background: "rgba(217,119,6,0.05)",
                      borderRadius: 6,
                      marginBottom: 6,
                      border: "1px solid rgba(217,119,6,0.15)",
                      fontSize: 12,
                      color: "rgba(255,255,255,0.7)",
                      fontFamily: "var(--ff-body)",
                      display: "flex",
                      justifyContent: "space-between"
                    }}>
                      <span>{point.pattern}</span>
                      <span style={{ color: "rgba(255,255,255,0.3)" }}>
                        {point.frequency}x
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {memory.patterns.successPatterns?.length > 0 && (
                <div>
                  <h4 style={{ 
                    fontSize: 12, 
                    color: "#059669",
                    marginBottom: 12,
                    fontFamily: "var(--ff-body)",
                    fontWeight: 600,
                    textTransform: "uppercase"
                  }}>
                    Success Patterns
                  </h4>
                  {memory.patterns.successPatterns.map((pattern, i) => (
                    <div key={i} style={{
                      padding: "10px 14px",
                      background: "rgba(5,150,105,0.05)",
                      borderRadius: 6,
                      marginBottom: 6,
                      border: "1px solid rgba(5,150,105,0.15)",
                      fontSize: 12,
                      color: "rgba(255,255,255,0.7)",
                      fontFamily: "var(--ff-body)",
                      display: "flex",
                      justifyContent: "space-between"
                    }}>
                      <span>{pattern.pattern}</span>
                      <span style={{ color: "rgba(255,255,255,0.3)" }}>
                        {pattern.frequency}x
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {(!memory.patterns.stickingPoints?.length && !memory.patterns.successPatterns?.length) && (
                <EmptyState message="No patterns detected yet. Keep working to discover your patterns!" />
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{
          padding: "16px 24px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          gap: 12,
          justifyContent: "flex-end"
        }}>
          <button
            onClick={pruneMemory}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "transparent",
              color: "rgba(255,255,255,0.4)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--ff-body)"
            }}
          >
            Clean Up Memory
          </button>
          <button
            onClick={exportMemory}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "none",
              background: "rgba(232,85,58,0.1)",
              color: "#E8553A",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--ff-body)"
            }}
          >
            Export Memory
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, total }) {
  return (
    <div style={{
      padding: "16px 20px",
      background: "rgba(255,255,255,0.02)",
      borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.05)"
    }}>
      <div style={{ 
        fontSize: 10, 
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "rgba(255,255,255,0.4)",
        marginBottom: 8,
        fontFamily: "var(--ff-body)"
      }}>
        {label}
      </div>
      <div style={{ 
        fontSize: 28, 
        fontWeight: 300,
        color: "rgba(255,255,255,0.9)",
        fontFamily: "var(--ff-heading)"
      }}>
        {value}
        {total !== undefined && (
          <span style={{ 
            fontSize: 14, 
            color: "rgba(255,255,255,0.3)",
            marginLeft: 4
          }}>
            /{total}
          </span>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div style={{
      padding: "60px 20px",
      textAlign: "center",
      color: "rgba(255,255,255,0.3)",
      fontSize: 13,
      fontFamily: "var(--ff-body)"
    }}>
      {message}
    </div>
  );
}
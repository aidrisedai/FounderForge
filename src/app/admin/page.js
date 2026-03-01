"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CURRICULUM } from "@/lib/curriculum";
import styles from "./admin.module.css";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalProjects: 0,
    totalCompletions: 0
  });

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch("/api/admin/auth");
      const data = await res.json();
      
      if (!data.authenticated) {
        router.push("/admin/login");
        return;
      }
      
      setAuthenticated(true);
      await fetchAllUsers();
    } catch (error) {
      console.error("Auth check failed:", error);
      router.push("/admin/login");
    }
    setLoading(false);
  }

  async function fetchAllUsers() {
    try {
      const res = await fetch("/api/admin/all-users");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        throw new Error("Failed to fetch users");
      }
      
      const data = await res.json();
      setUsers(data.users || []);
      
      // Calculate stats
      const totalProjects = data.users.reduce((sum, u) => sum + u.projects, 0);
      const totalCompletions = data.users.filter(u => u.progress === 100).length;
      
      setStats({
        totalUsers: data.totalUsers,
        activeUsers: data.activeUsers,
        totalProjects,
        totalCompletions
      });
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  }

  async function fetchUserDetails(email) {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/user-details?email=${encodeURIComponent(email)}`);
      
      if (!res.ok) {
        throw new Error("Failed to fetch user details");
      }
      
      const data = await res.json();
      setUserDetails(data.user);
      setSelectedUser(email);
      setActiveTab("conversations");
    } catch (error) {
      console.error("Failed to fetch user details:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/admin/auth", { method: "DELETE" });
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  async function exportUserData() {
    if (!userDetails) return;
    
    const dataStr = JSON.stringify(userDetails, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `user_${selectedUser}_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (loading && !authenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>FounderForge Admin</h1>
            <p className={styles.subtitle}>System Administration Dashboard</p>
          </div>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.totalUsers}</div>
          <div className={styles.statLabel}>Total Users</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.activeUsers}</div>
          <div className={styles.statLabel}>Active (7d)</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.totalProjects}</div>
          <div className={styles.statLabel}>Total Projects</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.totalCompletions}</div>
          <div className={styles.statLabel}>Completions</div>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.sidebar}>
          <h2 className={styles.sidebarTitle}>All Users</h2>
          <div className={styles.userList}>
            {users.map(user => (
              <div
                key={user.email}
                className={`${styles.userItem} ${selectedUser === user.email ? styles.userItemActive : ""}`}
                onClick={() => fetchUserDetails(user.email)}
              >
                <div className={styles.userEmail}>{user.email}</div>
                <div className={styles.userMeta}>
                  <span className={styles.userProjects}>{user.projects} projects</span>
                  <span className={styles.userProgress}>{user.progress}%</span>
                </div>
                {user.personality && (
                  <span className={styles.personalityBadge}>✨ Personality</span>
                )}
                {user.memorySummary && (
                  <div className={styles.memorySummary}>
                    <span>{user.memorySummary.insights} insights</span>
                    <span>{user.memorySummary.milestones} milestones</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.contentArea}>
          {!selectedUser ? (
            <div className={styles.placeholder}>
              Select a user to view their details
            </div>
          ) : loading ? (
            <div className={styles.loading}>Loading user details...</div>
          ) : userDetails ? (
            <>
              <div className={styles.userHeader}>
                <h2>{selectedUser}</h2>
                <button onClick={exportUserData} className={styles.exportButton}>
                  Export Data
                </button>
              </div>

              <div className={styles.tabs}>
                <button
                  className={`${styles.tab} ${activeTab === "overview" ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab("overview")}
                >
                  Overview
                </button>
                <button
                  className={`${styles.tab} ${activeTab === "conversations" ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab("conversations")}
                >
                  Conversations ({userDetails.conversations?.length || 0})
                </button>
                <button
                  className={`${styles.tab} ${activeTab === "projects" ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab("projects")}
                >
                  Projects ({userDetails.projects?.length || 0})
                </button>
                <button
                  className={`${styles.tab} ${activeTab === "memory" ? styles.tabActive : ""}`}
                  onClick={() => setActiveTab("memory")}
                >
                  Memory & Insights
                </button>
                {userDetails.personality && (
                  <button
                    className={`${styles.tab} ${activeTab === "personality" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("personality")}
                  >
                    Personality
                  </button>
                )}
              </div>

              <div className={styles.tabContent}>
                {activeTab === "overview" && (
                  <div className={styles.overview}>
                    <h3>User Statistics</h3>
                    <div className={styles.overviewStats}>
                      <div>Total Projects: {userDetails.stats?.totalProjects || 0}</div>
                      <div>Total Conversations: {userDetails.stats?.totalConversations || 0}</div>
                      <div>Total Messages: {userDetails.stats?.totalMessages || 0}</div>
                      <div>Completed Tasks: {userDetails.stats?.completedTasks || 0}</div>
                      <div>Deliverables: {userDetails.stats?.totalDeliverables || 0}</div>
                    </div>
                    {userDetails.memory && (
                      <div className={styles.memoryOverview}>
                        <h4>Memory Summary</h4>
                        <div>Last Active: {new Date(userDetails.memory.lastActive).toLocaleString()}</div>
                        <div>Insights: {userDetails.memory.insights?.length || 0}</div>
                        <div>Milestones: {userDetails.memory.milestones?.length || 0}</div>
                        <div>Decisions: {userDetails.memory.decisions?.length || 0}</div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "conversations" && (
                  <div className={styles.conversations}>
                    {userDetails.conversations?.map((conv, idx) => (
                      <div key={idx} className={styles.conversation}>
                        <div className={styles.convHeader}>
                          <h4>{conv.taskTitle}</h4>
                          <span className={styles.convMeta}>
                            {conv.projectName} • {conv.stepTitle} • {conv.messageCount} messages
                          </span>
                          {conv.completed && <span className={styles.completedBadge}>✓ Completed</span>}
                        </div>
                        {conv.deliverable && (
                          <div className={styles.deliverable}>
                            <strong>Deliverable:</strong> {conv.deliverable}
                          </div>
                        )}
                        <div className={styles.messages}>
                          {conv.messages.map((msg, midx) => (
                            <div
                              key={midx}
                              className={msg.role === "user" ? styles.userMessage : styles.assistantMessage}
                            >
                              <strong>{msg.role === "user" ? "User" : "Mentor"}:</strong>
                              <div className={styles.messageContent}>{msg.content}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "projects" && (
                  <div className={styles.projects}>
                    {userDetails.projects?.map((project, idx) => (
                      <div key={idx} className={styles.project}>
                        <h3>{project.name}</h3>
                        <div className={styles.projectId}>ID: {project.id}</div>
                        <div className={styles.projectProgress}>
                          <h4>Progress by Stage</h4>
                          {CURRICULUM.map(step => {
                            const completed = project.completedTasks?.[step.id] || 0;
                            const percentage = (completed / step.tasks.length) * 100;
                            return (
                              <div key={step.id} className={styles.stageProgress}>
                                <span>{step.title}:</span>
                                <div className={styles.progressBar}>
                                  <div
                                    className={styles.progressFill}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span>{completed}/{step.tasks.length}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className={styles.deliverables}>
                          <h4>Deliverables ({Object.keys(project.deliverables || {}).length})</h4>
                          {Object.entries(project.deliverables || {}).map(([taskId, content]) => (
                            <div key={taskId} className={styles.deliverableItem}>
                              <strong>{taskId}:</strong> {content}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "memory" && userDetails.memory && (
                  <div className={styles.memory}>
                    <div className={styles.memorySection}>
                      <h3>Recent Insights</h3>
                      {userDetails.memory.insights?.slice(-10).reverse().map((insight, idx) => (
                        <div key={idx} className={styles.insight}>
                          <div>{insight.content}</div>
                          <div className={styles.insightMeta}>
                            {new Date(insight.timestamp).toLocaleString()}
                            {insight.importance === "high" && <span className={styles.highImportance}>High</span>}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={styles.memorySection}>
                      <h3>Milestones</h3>
                      {userDetails.memory.milestones?.slice(-10).reverse().map((milestone, idx) => (
                        <div key={idx} className={styles.milestone}>
                          <div>{milestone.milestone}</div>
                          <div className={styles.milestoneMeta}>
                            {new Date(milestone.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={styles.memorySection}>
                      <h3>Patterns</h3>
                      {userDetails.memory.patterns?.stickingPoints?.length > 0 && (
                        <div>
                          <h4>Challenges</h4>
                          {userDetails.memory.patterns.stickingPoints.map((point, idx) => (
                            <div key={idx} className={styles.pattern}>
                              {point.pattern} ({point.frequency}x)
                            </div>
                          ))}
                        </div>
                      )}
                      {userDetails.memory.patterns?.successPatterns?.length > 0 && (
                        <div>
                          <h4>Successes</h4>
                          {userDetails.memory.patterns.successPatterns.map((pattern, idx) => (
                            <div key={idx} className={styles.pattern}>
                              {pattern.pattern} ({pattern.frequency}x)
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "personality" && userDetails.personality && (
                  <div className={styles.personality}>
                    <h3>Personality Profile</h3>
                    <div className={styles.personalityTraits}>
                      <div className={styles.trait}>
                        <strong>Work Style:</strong> {userDetails.personality.personality?.workStyle}
                      </div>
                      <div className={styles.trait}>
                        <strong>Experience:</strong> {userDetails.personality.personality?.experience}
                      </div>
                      <div className={styles.trait}>
                        <strong>Motivation:</strong> {userDetails.personality.personality?.motivation}
                      </div>
                      <div className={styles.trait}>
                        <strong>Learning:</strong> {userDetails.personality.personality?.learning}
                      </div>
                      <div className={styles.trait}>
                        <strong>Pace:</strong> {userDetails.personality.personality?.pace}
                      </div>
                    </div>
                    <div className={styles.personalityMeta}>
                      <div>Completed: {userDetails.personality.completed ? "Yes" : "No"}</div>
                      <div>Updated: {new Date(userDetails.personality.updatedAt).toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.error}>Failed to load user details</div>
          )}
        </div>
      </div>
    </div>
  );
}
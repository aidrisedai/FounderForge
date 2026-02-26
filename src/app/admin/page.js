'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CURRICULUM } from '@/lib/curriculum';
import styles from './admin.module.css';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/');
      return;
    }
    
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || [];
    if (!adminEmails.includes(session.user.email)) {
      router.push('/');
      return;
    }
    
    fetchAnalytics();
    fetchUsers();
  }, [session, status, router]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setLoading(false);
    }
  };

  const fetchConversations = async (userId, projectId) => {
    try {
      const res = await fetch(`/api/admin/conversations?userId=${userId}&projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSelectedProject(null);
    setConversations([]);
    setActiveTab('user-detail');
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    if (selectedUser) {
      fetchConversations(selectedUser.userId, project.id);
    }
  };

  const exportData = async () => {
    setExportLoading(true);
    try {
      const data = {
        analytics,
        users,
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `founderforge-admin-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
    setExportLoading(false);
  };

  const getTaskInfo = (taskId) => {
    for (const stage of CURRICULUM) {
      const task = stage.tasks.find(t => t.id === taskId);
      if (task) return { stage, task };
    }
    return null;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>FounderForge Admin</h1>
            <p className={styles.subtitle}>Platform Analytics & User Monitoring</p>
          </div>
          <div className={styles.headerActions}>
            <button
              onClick={exportData}
              disabled={exportLoading}
              className={styles.button}
            >
              {exportLoading ? 'Exporting...' : 'Export Data'}
            </button>
            <button
              onClick={() => router.push('/')}
              className={styles.button}
            >
              Back to App
            </button>
          </div>
        </div>
      </header>

      <div className={styles.main}>
        <div className={styles.tabs}>
          <button
            onClick={() => setActiveTab('overview')}
            className={`${styles.tab} ${
              activeTab === 'overview' ? styles.tabActive : styles.tabInactive
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`${styles.tab} ${
              activeTab === 'users' ? styles.tabActive : styles.tabInactive
            }`}
          >
            Users
          </button>
          {selectedUser && (
            <button
              onClick={() => setActiveTab('user-detail')}
              className={`${styles.tab} ${
                activeTab === 'user-detail' ? styles.tabActive : styles.tabInactive
              }`}
            >
              {selectedUser.userId.split('_')[0]}...
            </button>
          )}
        </div>

        {activeTab === 'overview' && analytics && (
          <div>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{color: '#E8553A'}}>
                  {analytics.totalUsers}
                </div>
                <div className={styles.statLabel}>Total Users</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{color: '#BE185D'}}>
                  {analytics.totalProjects}
                </div>
                <div className={styles.statLabel}>Total Projects</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{color: '#3B82F6'}}>
                  {analytics.totalMessages}
                </div>
                <div className={styles.statLabel}>Messages Sent</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue} style={{color: '#10B981'}}>
                  {analytics.totalCompletedTasks}
                </div>
                <div className={styles.statLabel}>Tasks Completed</div>
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Stage Progress Distribution</h3>
              <div>
                {CURRICULUM.map(stage => {
                  const count = analytics.stageProgress[stage.id] || 0;
                  const maxCount = Math.max(...Object.values(analytics.stageProgress), 1);
                  const percentage = (count / maxCount) * 100;
                  
                  return (
                    <div key={stage.id} className={styles.stageItem}>
                      <div className={styles.stageLabel}>{stage.title}</div>
                      <div className={styles.stageBarContainer}>
                        <div 
                          className={styles.stageBar}
                          style={{
                            width: `${percentage}%`,
                            background: `linear-gradient(to right, ${stage.color}, ${stage.color}dd)`
                          }}
                        />
                        <div className={styles.stageBarText}>
                          {count} tasks
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Recent Activity</h3>
              <div className={styles.activityList}>
                {analytics.recentActivities.slice(0, 20).map((activity, idx) => (
                  <div key={idx} className={styles.activityItem}>
                    <div style={{flex: 1}}>
                      <div className={styles.activityTime}>
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                      <div className={styles.activityText}>
                        <span className={styles.activityUser}>
                          {activity.userId.split('_')[0]}...
                        </span>
                        {activity.type === 'message' && (
                          <span> sent message in {activity.taskTitle}</span>
                        )}
                        {activity.type === 'task_completed' && (
                          <span className={styles.activityComplete}> completed {activity.taskTitle}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className={styles.card}>
            <div style={{overflowX: 'auto'}}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableHeader}>
                    <th className={styles.tableHeaderCell}>User</th>
                    <th className={styles.tableHeaderCell}>Projects</th>
                    <th className={styles.tableHeaderCell}>Activities</th>
                    <th className={styles.tableHeaderCell}>Last Active</th>
                    <th className={styles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.userId} className={styles.tableRow}>
                      <td className={styles.tableCell}>{user.userId}</td>
                      <td className={styles.tableCell}>{user.projectCount}</td>
                      <td className={styles.tableCell}>{user.totalActivities}</td>
                      <td className={styles.tableCell} style={{color: 'rgba(255, 255, 255, 0.4)'}}>
                        {user.lastActive ? new Date(user.lastActive).toLocaleString() : 'Never'}
                      </td>
                      <td className={styles.tableCell}>
                        <button
                          onClick={() => handleUserSelect(user)}
                          className={styles.viewButton}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'user-detail' && selectedUser && (
          <div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>User: {selectedUser.userId}</h3>
              <div className={styles.userInfo}>
                <div className={styles.infoBlock}>
                  <div className={styles.infoLabel}>Total Projects</div>
                  <div className={styles.infoValue}>{selectedUser.projectCount}</div>
                </div>
                <div className={styles.infoBlock}>
                  <div className={styles.infoLabel}>Total Activities</div>
                  <div className={styles.infoValue}>{selectedUser.totalActivities}</div>
                </div>
              </div>

              <div>
                <h4 style={{fontWeight: 600, marginBottom: '1rem'}}>Projects:</h4>
                {selectedUser.projects.map(project => (
                  <div 
                    key={project.id}
                    className={`${styles.projectCard} ${
                      selectedProject?.id === project.id ? styles.projectCardActive : ''
                    }`}
                    onClick={() => handleProjectSelect(project)}
                  >
                    <div className={styles.projectHeader}>
                      <div>
                        <h5 className={styles.projectName}>{project.name}</h5>
                        <div className={styles.projectId}>ID: {project.id}</div>
                      </div>
                      <div className={styles.projectStats}>
                        <div className={styles.projectStatsLabel}>Completed Tasks</div>
                        <div className={styles.projectStatsValue}>
                          {Object.values(project.completedTasks || {}).reduce((a, b) => a + b, 0)}
                        </div>
                      </div>
                    </div>
                    
                    {project.deliverables && Object.keys(project.deliverables).length > 0 && (
                      <div className={styles.deliverables}>
                        <div style={{fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.4)', marginBottom: '0.5rem'}}>
                          Deliverables:
                        </div>
                        <div>
                          {Object.entries(project.deliverables).slice(0, 3).map(([taskId, deliverable]) => {
                            const taskInfo = getTaskInfo(taskId);
                            return (
                              <div key={taskId} className={styles.deliverableItem}>
                                <div className={styles.deliverableTask}>
                                  {taskInfo?.task.title || taskId}:
                                </div>
                                <div className={styles.deliverableText}>
                                  {deliverable}
                                </div>
                              </div>
                            );
                          })}
                          {Object.keys(project.deliverables).length > 3 && (
                            <div className={styles.moreDeliverables}>
                              +{Object.keys(project.deliverables).length - 3} more deliverables
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {selectedProject && conversations.length > 0 && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>
                  Conversations for Project: {selectedProject.name}
                </h3>
                <div>
                  {conversations.map((conv, idx) => {
                    const taskInfo = getTaskInfo(conv.taskId);
                    return (
                      <div key={idx} className={styles.conversationCard}>
                        <div className={styles.conversationHeader}>
                          <div className={styles.conversationTask}>
                            {taskInfo?.stage.title} → {taskInfo?.task.title}
                          </div>
                          <div className={styles.conversationTaskId}>
                            Task ID: {conv.taskId}
                          </div>
                        </div>
                        
                        <div className={styles.messages}>
                          {conv.messages.map((msg, msgIdx) => (
                            <div 
                              key={msgIdx} 
                              className={`${styles.message} ${
                                msg.role === 'user' ? styles.messageUser : styles.messageAi
                              }`}
                            >
                              <div className={styles.messageRole}>
                                {msg.role === 'user' ? 'User' : 'AI Mentor'}
                              </div>
                              <div className={styles.messageContent}>
                                {msg.content}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {conv.deliverable && (
                          <div className={styles.finalDeliverable}>
                            <div className={styles.deliverableLabel}>Final Deliverable:</div>
                            <div className={styles.deliverableContent}>
                              {conv.deliverable}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
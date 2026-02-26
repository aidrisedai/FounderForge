'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CURRICULUM } from '@/lib/curriculum';

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
  }, [session, status]);

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

  const getStageInfo = (stageId) => {
    return CURRICULUM.find(s => s.id === parseInt(stageId)) || null;
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
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-600 bg-clip-text text-transparent">
              FounderForge Admin
            </h1>
            <p className="text-gray-400 text-sm">Platform Analytics & User Monitoring</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={exportData}
              disabled={exportLoading}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {exportLoading ? 'Exporting...' : 'Export Data'}
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Back to App
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'overview' 
                ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white' 
                : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'users' 
                ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white' 
                : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
            }`}
          >
            Users
          </button>
          {selectedUser && (
            <button
              onClick={() => setActiveTab('user-detail')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'user-detail' 
                  ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white' 
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-400'
              }`}
            >
              {selectedUser.userId.split('_')[0]}...
            </button>
          )}
        </div>

        {activeTab === 'overview' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="text-3xl font-bold text-orange-500">{analytics.totalUsers}</div>
                <div className="text-gray-400 text-sm mt-1">Total Users</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="text-3xl font-bold text-pink-600">{analytics.totalProjects}</div>
                <div className="text-gray-400 text-sm mt-1">Total Projects</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="text-3xl font-bold text-blue-500">{analytics.totalMessages}</div>
                <div className="text-gray-400 text-sm mt-1">Messages Sent</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="text-3xl font-bold text-green-500">{analytics.totalCompletedTasks}</div>
                <div className="text-gray-400 text-sm mt-1">Tasks Completed</div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4">Stage Progress Distribution</h3>
              <div className="space-y-3">
                {CURRICULUM.map(stage => {
                  const count = analytics.stageProgress[stage.id] || 0;
                  const maxCount = Math.max(...Object.values(analytics.stageProgress), 1);
                  const percentage = (count / maxCount) * 100;
                  
                  return (
                    <div key={stage.id} className="flex items-center gap-3">
                      <div className="w-24 text-sm text-gray-400">{stage.title}</div>
                      <div className="flex-1 bg-gray-800 rounded-full h-6 relative overflow-hidden">
                        <div 
                          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            background: `linear-gradient(to right, ${stage.color}, ${stage.color}dd)`
                          }}
                        />
                        <div className="absolute inset-y-0 left-2 flex items-center text-xs font-semibold">
                          {count} tasks
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {analytics.recentActivities.slice(0, 20).map((activity, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-800">
                    <div className="flex-1">
                      <span className="text-sm text-gray-400">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                      <div className="text-sm">
                        <span className="text-orange-500">{activity.userId.split('_')[0]}...</span>
                        {activity.type === 'message' && (
                          <span> sent message in {activity.taskTitle}</span>
                        )}
                        {activity.type === 'task_completed' && (
                          <span className="text-green-500"> completed {activity.taskTitle}</span>
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
          <div className="bg-gray-900 rounded-lg border border-gray-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">User</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Projects</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Activities</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Last Active</th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.userId} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="px-6 py-3 text-sm">{user.userId}</td>
                      <td className="px-6 py-3 text-sm">{user.projectCount}</td>
                      <td className="px-6 py-3 text-sm">{user.totalActivities}</td>
                      <td className="px-6 py-3 text-sm text-gray-400">
                        {user.lastActive ? new Date(user.lastActive).toLocaleString() : 'Never'}
                      </td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleUserSelect(user)}
                          className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
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
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-lg font-semibold mb-4">User: {selectedUser.userId}</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-sm text-gray-400">Total Projects</div>
                  <div className="text-2xl font-bold">{selectedUser.projectCount}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Total Activities</div>
                  <div className="text-2xl font-bold">{selectedUser.totalActivities}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Projects:</h4>
                {selectedUser.projects.map(project => (
                  <div 
                    key={project.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedProject?.id === project.id 
                        ? 'bg-gray-800 border-orange-500' 
                        : 'bg-gray-950 border-gray-800 hover:bg-gray-800/50'
                    }`}
                    onClick={() => handleProjectSelect(project)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-semibold text-orange-500">{project.name}</h5>
                        <div className="text-sm text-gray-400 mt-1">
                          ID: {project.id}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400">Completed Tasks</div>
                        <div className="text-lg font-semibold">
                          {Object.values(project.completedTasks || {}).reduce((a, b) => a + b, 0)}
                        </div>
                      </div>
                    </div>
                    
                    {project.deliverables && Object.keys(project.deliverables).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-800">
                        <div className="text-sm text-gray-400 mb-2">Deliverables:</div>
                        <div className="space-y-2">
                          {Object.entries(project.deliverables).slice(0, 3).map(([taskId, deliverable]) => {
                            const taskInfo = getTaskInfo(taskId);
                            return (
                              <div key={taskId} className="text-sm">
                                <div className="text-orange-500">
                                  {taskInfo?.task.title || taskId}:
                                </div>
                                <div className="text-gray-300 truncate">
                                  {deliverable}
                                </div>
                              </div>
                            );
                          })}
                          {Object.keys(project.deliverables).length > 3 && (
                            <div className="text-sm text-gray-500">
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
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 className="text-lg font-semibold mb-4">
                  Conversations for Project: {selectedProject.name}
                </h3>
                <div className="space-y-6">
                  {conversations.map((conv, idx) => {
                    const taskInfo = getTaskInfo(conv.taskId);
                    return (
                      <div key={idx} className="border border-gray-800 rounded-lg p-4">
                        <div className="mb-3 pb-3 border-b border-gray-800">
                          <div className="text-sm text-gray-400">
                            {taskInfo?.stage.title} → {taskInfo?.task.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Task ID: {conv.taskId}
                          </div>
                        </div>
                        
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {conv.messages.map((msg, msgIdx) => (
                            <div 
                              key={msgIdx} 
                              className={`p-3 rounded-lg ${
                                msg.role === 'user' 
                                  ? 'bg-gray-800 ml-8' 
                                  : 'bg-gray-950 mr-8 border border-gray-800'
                              }`}
                            >
                              <div className="text-xs text-gray-500 mb-1">
                                {msg.role === 'user' ? 'User' : 'AI Mentor'}
                              </div>
                              <div className="text-sm whitespace-pre-wrap">
                                {msg.content}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {conv.deliverable && (
                          <div className="mt-4 pt-4 border-t border-gray-800">
                            <div className="text-sm text-gray-400 mb-1">Final Deliverable:</div>
                            <div className="text-sm bg-green-900/20 border border-green-800 rounded p-3">
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
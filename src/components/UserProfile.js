"use client";
import { useState, useEffect } from "react";
import styles from "./UserProfile.module.css";

export default function UserProfile({ onClose }) {
  const [profileData, setProfileData] = useState(null);
  const [activeTab, setActiveTab] = useState("stats");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await fetch("/api/gamification/stats");
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <div className={styles.loading}>Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profileData) return null;

  const { stats, achievements, leaderboard } = profileData;

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        <div className={styles.header}>
          <div className={styles.levelBadge}>
            <span className={styles.levelNumber}>{stats.level}</span>
            <span className={styles.levelName}>{stats.currentLevel.name}</span>
          </div>
          
          <div className={styles.userInfo}>
            <h2>Your Profile</h2>
            <p className={styles.rank}>
              {leaderboard.rank ? `Rank #${leaderboard.rank} of ${leaderboard.totalPlayers}` : "Unranked"}
            </p>
          </div>
          
          <div className={styles.xpInfo}>
            <div className={styles.xpText}>
              <span className={styles.currentXP}>{stats.xp} XP</span>
              {stats.nextLevel && (
                <span className={styles.nextLevel}>/ {stats.nextLevel.minXP} XP</span>
              )}
            </div>
            <div className={styles.xpBar}>
              <div 
                className={styles.xpProgress} 
                style={{ width: `${stats.progressPercentage}%` }}
              />
            </div>
            {stats.xpToNextLevel > 0 && (
              <p className={styles.xpToNext}>{stats.xpToNextLevel} XP to {stats.nextLevel.name}</p>
            )}
          </div>
        </div>

        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === "stats" ? styles.active : ""}`}
            onClick={() => setActiveTab("stats")}
          >
            Stats
          </button>
          <button 
            className={`${styles.tab} ${activeTab === "achievements" ? styles.active : ""}`}
            onClick={() => setActiveTab("achievements")}
          >
            Achievements ({achievements.earnedCount}/{achievements.total})
          </button>
          <button 
            className={`${styles.tab} ${activeTab === "leaderboard" ? styles.active : ""}`}
            onClick={() => setActiveTab("leaderboard")}
          >
            Leaderboard
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === "stats" && (
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🔥</div>
                <div className={styles.statValue}>{stats.streak}</div>
                <div className={styles.statLabel}>Day Streak</div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statIcon}>✅</div>
                <div className={styles.statValue}>{stats.tasksCompleted}</div>
                <div className={styles.statLabel}>Tasks Completed</div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statIcon}>⚡</div>
                <div className={styles.statValue}>
                  {stats.averageSpeed ? Math.round(stats.averageSpeed) : 0} min
                </div>
                <div className={styles.statLabel}>Avg. Task Time</div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statIcon}>🎯</div>
                <div className={styles.statValue}>{stats.perfectDays}</div>
                <div className={styles.statLabel}>Perfect Days</div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statIcon}>💎</div>
                <div className={styles.statValue}>{stats.points}</div>
                <div className={styles.statLabel}>Total Points</div>
              </div>
              
              <div className={styles.statCard}>
                <div className={styles.statIcon}>⏱️</div>
                <div className={styles.statValue}>
                  {Math.round(stats.totalTimeSpent / 60)} hrs
                </div>
                <div className={styles.statLabel}>Time Invested</div>
              </div>
            </div>
          )}

          {activeTab === "achievements" && (
            <div className={styles.achievementsSection}>
              {achievements.earned.length > 0 && (
                <>
                  <h3>Earned Achievements</h3>
                  <div className={styles.achievementsGrid}>
                    {achievements.earned.map((achievement) => (
                      <div key={achievement.id} className={styles.achievementCard}>
                        <div className={styles.achievementIcon}>{achievement.icon}</div>
                        <div className={styles.achievementInfo}>
                          <h4>{achievement.name}</h4>
                          <p>{achievement.description}</p>
                          <span className={styles.xpReward}>+{achievement.xpReward} XP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              {achievements.unearned.length > 0 && (
                <>
                  <h3>Locked Achievements</h3>
                  <div className={styles.achievementsGrid}>
                    {achievements.unearned.map((achievement) => (
                      <div key={achievement.id} className={`${styles.achievementCard} ${styles.locked}`}>
                        <div className={styles.achievementIcon}>🔒</div>
                        <div className={styles.achievementInfo}>
                          <h4>{achievement.name}</h4>
                          <p>{achievement.description}</p>
                          <span className={styles.xpReward}>+{achievement.xpReward} XP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "leaderboard" && (
            <div className={styles.leaderboardSection}>
              <div className={styles.leaderboardList}>
                {leaderboard.topPlayers.map((player, index) => (
                  <div 
                    key={player.userId} 
                    className={`${styles.leaderboardEntry} ${player.userId === stats.userId ? styles.currentUser : ""}`}
                  >
                    <div className={styles.rank}>
                      {player.rank <= 3 ? (
                        <span className={styles[`rank${player.rank}`]}>
                          {player.rank === 1 ? "🥇" : player.rank === 2 ? "🥈" : "🥉"}
                        </span>
                      ) : (
                        <span>#{player.rank}</span>
                      )}
                    </div>
                    <div className={styles.playerInfo}>
                      <span className={styles.playerName}>{player.name}</span>
                      <span className={styles.playerStats}>
                        Level {player.level} • {player.xp} XP • 🔥 {player.streak}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {leaderboard.rank > 10 && (
                <div className={styles.userRank}>
                  <div className={styles.leaderboardEntry + " " + styles.currentUser}>
                    <div className={styles.rank}>#{leaderboard.rank}</div>
                    <div className={styles.playerInfo}>
                      <span className={styles.playerName}>You</span>
                      <span className={styles.playerStats}>
                        Level {stats.level} • {stats.xp} XP • 🔥 {stats.streak}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
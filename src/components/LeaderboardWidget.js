"use client";
import { useState, useEffect } from "react";
import styles from "./LeaderboardWidget.module.css";

export default function LeaderboardWidget() {
  const [leaderboard, setLeaderboard] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    // Refresh every 5 minutes
    const interval = setInterval(fetchLeaderboard, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch("/api/gamification/stats?type=leaderboard");
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.widget}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!leaderboard || !leaderboard.leaderboard.length) {
    return null;
  }

  const topPlayers = expanded 
    ? leaderboard.leaderboard.slice(0, 10)
    : leaderboard.leaderboard.slice(0, 3);

  return (
    <div className={`${styles.widget} ${expanded ? styles.expanded : ""}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>🏆 Leaderboard</h3>
        <button 
          className={styles.expandButton}
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? "−" : "+"}
        </button>
      </div>
      
      <div className={styles.playersList}>
        {topPlayers.map((player) => (
          <div 
            key={player.userId}
            className={`${styles.player} ${player.userId === leaderboard.userRank ? styles.currentUser : ""}`}
          >
            <div className={styles.rankBadge}>
              {player.rank === 1 ? "🥇" : player.rank === 2 ? "🥈" : player.rank === 3 ? "🥉" : `#${player.rank}`}
            </div>
            <div className={styles.playerInfo}>
              <span className={styles.playerName}>{player.name}</span>
              <span className={styles.playerXP}>{player.xp} XP</span>
            </div>
            {player.streak > 0 && (
              <div className={styles.streak}>🔥 {player.streak}</div>
            )}
          </div>
        ))}
      </div>
      
      {leaderboard.userRank && leaderboard.userRank > 10 && (
        <div className={styles.userPosition}>
          <div className={styles.divider} />
          <div className={`${styles.player} ${styles.currentUser}`}>
            <div className={styles.rankBadge}>#{leaderboard.userRank}</div>
            <div className={styles.playerInfo}>
              <span className={styles.playerName}>You</span>
              <span className={styles.playerXP}>Keep climbing!</span>
            </div>
          </div>
        </div>
      )}
      
      {expanded && (
        <div className={styles.footer}>
          <p className={styles.totalPlayers}>
            {leaderboard.totalPlayers} founders competing
          </p>
        </div>
      )}
    </div>
  );
}
"use client";
import { useState, useEffect } from "react";
import styles from "./AchievementNotification.module.css";

export default function AchievementNotification({ achievement, xpEarned, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setVisible(true), 100);
    
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  if (!achievement) return null;

  return (
    <div className={`${styles.notification} ${visible ? styles.visible : ""}`}>
      <div className={styles.content}>
        <div className={styles.icon}>{achievement.icon}</div>
        <div className={styles.info}>
          <h3 className={styles.title}>Achievement Unlocked!</h3>
          <p className={styles.name}>{achievement.name}</p>
          <p className={styles.description}>{achievement.description}</p>
          {xpEarned && (
            <span className={styles.xp}>+{xpEarned} XP</span>
          )}
        </div>
        <button className={styles.closeButton} onClick={handleClose}>×</button>
      </div>
      <div className={styles.progressBar}>
        <div className={styles.progress} />
      </div>
    </div>
  );
}

// Level up notification component
export function LevelUpNotification({ newLevel, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setVisible(true), 100);
    
    // Auto-close after 4 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  if (!newLevel) return null;

  return (
    <div className={`${styles.levelUp} ${visible ? styles.visible : ""}`}>
      <div className={styles.levelUpContent}>
        <div className={styles.levelUpAnimation}>
          <div className={styles.levelNumber}>{newLevel.level}</div>
          <div className={styles.levelStars}>✨</div>
        </div>
        <div className={styles.levelInfo}>
          <h2 className={styles.levelUpTitle}>Level Up!</h2>
          <p className={styles.levelName}>You are now a {newLevel.name}</p>
          <p className={styles.levelRange}>
            {newLevel.minXP} - {newLevel.maxXP === Infinity ? "∞" : newLevel.maxXP} XP
          </p>
        </div>
        <button className={styles.closeButton} onClick={handleClose}>×</button>
      </div>
    </div>
  );
}

// XP notification for regular task completion
export function XPNotification({ xpEarned, reason, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    const timer = setTimeout(() => {
      handleClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className={`${styles.xpNotification} ${visible ? styles.visible : ""}`}>
      <span className={styles.xpAmount}>+{xpEarned} XP</span>
      {reason && <span className={styles.xpReason}>{reason}</span>}
    </div>
  );
}
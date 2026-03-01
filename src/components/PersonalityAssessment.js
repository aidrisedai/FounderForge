"use client";
import { useState } from "react";
import { PERSONALITY_TRAITS, getPersonalitySummary } from "@/lib/personality";

export default function PersonalityAssessment({ onComplete, onSkip }) {
  const [currentTrait, setCurrentTrait] = useState(0);
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  
  const traitKeys = Object.keys(PERSONALITY_TRAITS);
  const trait = PERSONALITY_TRAITS[traitKeys[currentTrait]];
  const progress = ((currentTrait + 1) / traitKeys.length) * 100;
  
  async function handleSelect(optionId) {
    const newAnswers = { ...answers, [traitKeys[currentTrait]]: optionId };
    setAnswers(newAnswers);
    
    if (currentTrait < traitKeys.length - 1) {
      // Move to next question
      setTimeout(() => setCurrentTrait(currentTrait + 1), 300);
    } else {
      // Assessment complete, save to server
      setSaving(true);
      try {
        const res = await fetch("/api/personality", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ personality: newAnswers, completed: true })
        });
        
        if (res.ok) {
          onComplete(newAnswers);
        }
      } catch (error) {
        console.error("Error saving personality:", error);
      }
      setSaving(false);
    }
  }
  
  function handleBack() {
    if (currentTrait > 0) setCurrentTrait(currentTrait - 1);
  }
  
  if (saving) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 18, color: "rgba(255,255,255,.4)", fontFamily: "var(--ff-body)" }}>
          Saving your profile...
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }}>
      {/* Progress bar */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".1em", color: "rgba(255,255,255,.3)", fontFamily: "var(--ff-body)" }}>
            PERSONALITY PROFILE
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)", fontFamily: "var(--ff-body)" }}>
            {currentTrait + 1} of {traitKeys.length}
          </span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,.05)", overflow: "hidden" }}>
          <div 
            style={{ 
              height: "100%", 
              borderRadius: 2, 
              background: "linear-gradient(90deg,#E8553A,#BE185D)", 
              width: `${progress}%`, 
              transition: "width .6s" 
            }} 
          />
        </div>
      </div>
      
      {/* Question */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ 
          fontSize: 14, 
          fontWeight: 700, 
          letterSpacing: ".05em", 
          color: "#E8553A", 
          marginBottom: 12,
          fontFamily: "var(--ff-body)",
          textTransform: "uppercase"
        }}>
          {trait.title}
        </h3>
        <h2 style={{ 
          fontSize: 28, 
          fontFamily: "var(--ff-heading)", 
          lineHeight: 1.3,
          marginBottom: 24
        }}>
          {trait.question}
        </h2>
      </div>
      
      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {trait.options.map((option) => {
          const isSelected = answers[traitKeys[currentTrait]] === option.id;
          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              style={{
                padding: "16px 20px",
                borderRadius: 12,
                border: `1px solid ${isSelected ? "#E8553A" : "rgba(255,255,255,.08)"}`,
                background: isSelected ? "rgba(232,85,58,.08)" : "rgba(255,255,255,.02)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all .2s",
                position: "relative",
                overflow: "hidden"
              }}
              onMouseOver={e => {
                if (!isSelected) {
                  e.currentTarget.style.background = "rgba(255,255,255,.04)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,.12)";
                }
              }}
              onMouseOut={e => {
                if (!isSelected) {
                  e.currentTarget.style.background = "rgba(255,255,255,.02)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,.08)";
                }
              }}
            >
              <div style={{ 
                fontSize: 14, 
                fontWeight: 600, 
                color: isSelected ? "#E8553A" : "rgba(255,255,255,.9)",
                marginBottom: 4,
                fontFamily: "var(--ff-body)"
              }}>
                {option.label}
              </div>
              <div style={{ 
                fontSize: 12, 
                color: "rgba(255,255,255,.4)",
                fontFamily: "var(--ff-body)",
                lineHeight: 1.5
              }}>
                {option.description}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Navigation */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginTop: 32,
        paddingTop: 24,
        borderTop: "1px solid rgba(255,255,255,.05)"
      }}>
        <button
          onClick={currentTrait > 0 ? handleBack : onSkip}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,.08)",
            background: "transparent",
            color: "rgba(255,255,255,.4)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "var(--ff-body)"
          }}
        >
          {currentTrait > 0 ? "← Back" : "Skip for now"}
        </button>
        
        {currentTrait === 0 && (
          <div style={{ 
            fontSize: 11, 
            color: "rgba(255,255,255,.25)",
            fontFamily: "var(--ff-body)",
            fontStyle: "italic"
          }}>
            Takes ~2 minutes
          </div>
        )}
      </div>
    </div>
  );
}
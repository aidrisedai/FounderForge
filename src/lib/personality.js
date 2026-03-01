// Personality Assessment System for FounderForge
// Helps personalize the mentoring experience based on user traits

export const PERSONALITY_TRAITS = {
  workStyle: {
    title: "Work Style",
    question: "How do you prefer to work on projects?",
    options: [
      { id: "methodical", label: "Methodical & Planned", description: "I like clear steps and detailed planning" },
      { id: "iterative", label: "Iterative & Flexible", description: "I prefer to start quickly and adjust as I go" },
      { id: "creative", label: "Creative & Exploratory", description: "I enjoy exploring many possibilities before deciding" },
      { id: "analytical", label: "Analytical & Data-Driven", description: "I need data and evidence before making decisions" }
    ]
  },
  
  experience: {
    title: "Experience Level",
    question: "What's your background with startups?",
    options: [
      { id: "first-timer", label: "First-Timer", description: "This is my first startup journey" },
      { id: "side-hustler", label: "Side Hustler", description: "I've tried side projects while employed" },
      { id: "serial", label: "Serial Entrepreneur", description: "I've built multiple ventures" },
      { id: "corporate", label: "Corporate Background", description: "I'm transitioning from corporate work" }
    ]
  },
  
  motivation: {
    title: "Primary Motivation",
    question: "What drives you to build a startup?",
    options: [
      { id: "problem-solver", label: "Problem Solver", description: "I'm passionate about solving real problems" },
      { id: "freedom-seeker", label: "Freedom Seeker", description: "I want independence and control over my work" },
      { id: "impact-driven", label: "Impact Driven", description: "I want to make a significant difference" },
      { id: "wealth-builder", label: "Wealth Builder", description: "I'm focused on financial success" }
    ]
  },
  
  learning: {
    title: "Learning Style",  
    question: "How do you prefer to learn new concepts?",
    options: [
      { id: "by-doing", label: "By Doing", description: "I learn best through hands-on practice" },
      { id: "by-example", label: "By Example", description: "I need to see real examples and cases" },
      { id: "by-theory", label: "By Theory", description: "I like to understand principles first" },
      { id: "by-discussion", label: "By Discussion", description: "I learn through conversation and feedback" }
    ]
  },
  
  pace: {
    title: "Preferred Pace",
    question: "What pace feels right for you?",
    options: [
      { id: "sprint", label: "Sprint Mode", description: "Fast and intense, get it done quickly" },
      { id: "marathon", label: "Marathon Mode", description: "Steady and sustainable progress" },
      { id: "bursts", label: "Burst Mode", description: "Intense periods followed by reflection" },
      { id: "deliberate", label: "Deliberate Mode", description: "Careful and thorough at each step" }
    ]
  }
};

// Generate personalized examples based on personality
export function getPersonalizedExample(personality, context) {
  if (!personality) return null;
  
  const examples = {
    methodical: {
      problemHypothesis: "Software developers at mid-size companies struggle with tracking technical debt because it's not visible in their project management tools. They currently maintain separate spreadsheets, costing them 3-5 hours weekly on manual updates.",
      approach: "Let's break this down systematically. First, we'll define each component precisely, then validate each assumption with data."
    },
    iterative: {
      problemHypothesis: "Freelance designers struggle to get client feedback quickly because clients don't understand design language. They use endless email threads, losing 30% of project time to revisions.",
      approach: "Let's start with a rough hypothesis and refine it through quick conversations. We'll adjust as we learn."
    },
    creative: {
      problemHypothesis: "Content creators on TikTok struggle with burnout from constant posting pressure because the algorithm demands daily content. They sacrifice quality for quantity, losing 50% of their creative joy.",
      approach: "Let's explore different angles of this problem. There might be unexpected connections we haven't considered."
    },
    analytical: {
      problemHypothesis: "E-commerce store owners with $10K-50K monthly revenue struggle with inventory forecasting because they lack predictive tools. They overstock by 40% on average, tying up $15K in dead inventory.",
      approach: "We need data to validate each claim. Let's quantify the problem with specific metrics and evidence."
    }
  };
  
  const style = personality.workStyle;
  return examples[style] ? examples[style][context] : null;
}

// Generate personalized encouragement
export function getPersonalizedEncouragement(personality, stage) {
  if (!personality) return null;
  
  const encouragements = {
    "first-timer": {
      early: "Every successful founder started exactly where you are. Focus on learning, not perfection.",
      middle: "You're building founder muscles. Each conversation and iteration makes you stronger.",
      late: "Look how far you've come from day one. You're becoming a real founder."
    },
    "side-hustler": {
      early: "Your experience juggling priorities is a superpower. Use those time management skills.",
      middle: "You know how to ship in constraints. That's exactly what this stage needs.",
      late: "Time to consider if this deserves more than side-hustle energy."
    },
    "serial": {
      early: "You know the drill, but stay curious. This problem might surprise you.",
      middle: "Use your experience, but don't skip the validation. Every market is different.",
      late: "You've been here before. Trust your instincts on what comes next."
    },
    "corporate": {
      early: "Your structured thinking is valuable. Just remember: done beats perfect in startups.",
      middle: "You're unlearning corporate pace. Embrace the scrappy startup mindset.",
      late: "Your professional network could be your secret weapon for growth."
    }
  };
  
  const experience = personality.experience;
  const stageKey = stage < 2 ? 'early' : stage < 4 ? 'middle' : 'late';
  
  return encouragements[experience] ? encouragements[experience][stageKey] : null;
}

// Adapt communication style based on personality
export function getPersonalizedTone(personality) {
  if (!personality) return { style: 'balanced' };
  
  const tones = {
    'by-doing': { 
      style: 'action-oriented',
      prefix: "Let's dive in:",
      questionStyle: "What did you build/try/test?"
    },
    'by-example': {
      style: 'example-heavy',
      prefix: "Here's how others did it:",
      questionStyle: "Similar to how Airbnb did X, what's your approach?"
    },
    'by-theory': {
      style: 'conceptual',
      prefix: "The principle here is:",
      questionStyle: "Based on the framework, how would you apply this?"
    },
    'by-discussion': {
      style: 'conversational',
      prefix: "Let's talk through this:",
      questionStyle: "What are your thoughts on this?"
    }
  };
  
  return tones[personality.learning] || { style: 'balanced' };
}

// Get pacing recommendations
export function getPersonalizedPacing(personality) {
  if (!personality) return { tasks: 1, timeframe: 'this week' };
  
  const pacing = {
    'sprint': { tasks: 3, timeframe: 'today', reminder: "You're in sprint mode. Keep the momentum!" },
    'marathon': { tasks: 1, timeframe: 'this week', reminder: "Steady progress wins. No rush." },
    'bursts': { tasks: 2, timeframe: 'next few days', reminder: "Push hard, then take time to reflect." },
    'deliberate': { tasks: 1, timeframe: 'take your time', reminder: "Quality over speed. Do it right." }
  };
  
  return pacing[personality.pace] || { tasks: 1, timeframe: 'this week' };
}

// Generate a personality summary
export function getPersonalitySummary(personality) {
  if (!personality) return null;
  
  const traits = [];
  
  for (const [key, value] of Object.entries(personality)) {
    const trait = PERSONALITY_TRAITS[key];
    if (trait) {
      const option = trait.options.find(o => o.id === value);
      if (option) traits.push(option.label);
    }
  }
  
  return traits.join(" • ");
}

// Check if personality is complete
export function isPersonalityComplete(personality) {
  if (!personality) return false;
  
  const requiredTraits = Object.keys(PERSONALITY_TRAITS);
  return requiredTraits.every(trait => personality[trait]);
}

// Get question adaptation based on personality and context
export function adaptQuestionForPersonality(personality, baseQuestion, context) {
  if (!personality) return baseQuestion;
  
  const tone = getPersonalizedTone(personality);
  const example = getPersonalizedExample(personality, context);
  
  let adapted = baseQuestion;
  
  // Add personality-specific framing
  if (tone.prefix && Math.random() > 0.5) {
    adapted = `${tone.prefix} ${adapted}`;
  }
  
  // Add relevant example if available
  if (example && example[context]) {
    adapted += `\n\nFor someone with your ${personality.workStyle} style, an example might be: "${example[context]}"`;
  }
  
  return adapted;
}
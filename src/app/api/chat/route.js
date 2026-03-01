import { getServerSession } from "next-auth";
import { CURRICULUM } from "@/lib/curriculum";
import { logUserActivity } from "@/lib/admin-storage";
import { 
  getPersonalizedExample, 
  getPersonalizedEncouragement, 
  getPersonalizedTone,
  getPersonalizedPacing,
  adaptQuestionForPersonality 
} from "@/lib/personality";
import {
  loadUserMemory,
  saveUserMemory,
  updateProjectMemory,
  addInsight,
  updatePatterns,
  addMilestone,
  extractMemoriesForMentor
} from "@/lib/memory";

export async function POST(req) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages, stepId, taskIdx, project, personality } = await req.json();

  const step = CURRICULUM.find(s => s.id === stepId);
  if (!step) return Response.json({ error: "Invalid step" }, { status: 400 });

  const task = step.tasks[taskIdx];
  if (!task) return Response.json({ error: "Invalid task" }, { status: 400 });

  // Build system prompt with full context
  const dels = project?.deliverables || {};
  const allDel = Object.entries(dels).map(([id, d]) => {
    const s = CURRICULUM.find(s => s.tasks.some(t => t.id === id));
    const t = s ? s.tasks.find(t => t.id === id) : null;
    return t ? `[${s.title} → ${t.title}]: ${d}` : null;
  }).filter(Boolean).join("\n\n");

  const existingDel = dels[task.id];

  // Load user memory
  const userId = session.user.email.replace(/[^a-zA-Z0-9]/g, '_');
  let memory = await loadUserMemory(userId);
  
  // Extract relevant memories for context
  const memoryContext = extractMemoriesForMentor(memory, project?.id);

  // Get personality-based adaptations
  const tone = personality ? getPersonalizedTone(personality) : null;
  const pacing = personality ? getPersonalizedPacing(personality) : null;
  const encouragement = personality ? getPersonalizedEncouragement(personality, stepId) : null;
  const example = personality ? getPersonalizedExample(personality, 'problemHypothesis') : null;
  
  // Adapt the intro message if personality is available
  let adaptedIntro = task.intro;
  if (personality && tone) {
    adaptedIntro = adaptQuestionForPersonality(personality, task.intro, 'problemHypothesis');
  }

  const personalitySection = personality ? `
━━━ USER PERSONALITY PROFILE ━━━
Work Style: ${personality.workStyle}
Experience: ${personality.experience}
Motivation: ${personality.motivation}
Learning: ${personality.learning}
Pace: ${personality.pace}

ADAPT YOUR STYLE:
- Communication: ${tone?.style || 'balanced'}
- Question framing: ${tone?.questionStyle || 'standard'}
- Pacing: ${pacing?.timeframe || 'flexible'} (${pacing?.tasks || 1} task focus)
${encouragement ? `- Encouragement: ${encouragement}` : ''}
${example?.approach ? `- Approach style: ${example.approach}` : ''}
` : '';

  const systemPrompt = `You are a world-class startup mentor — think Paul Graham meets a demanding but caring professor.

PERSONALITY: Direct, warm, punchy. 2-4 paragraphs MAX. Real examples. Push back on vague. Celebrate breakthroughs. ONE question at a time.

PROJECT: "${project?.name || "Untitled"}"
User: ${session.user.name || session.user.email}
POSITION: Step ${step.id}/6 "${step.title}" → Task ${taskIdx + 1}/${step.tasks.length} "${task.title}"
${personalitySection}
━━━ CURRICULUM ━━━
Step overview: ${step.overview}
Learning goal: ${task.goal}
Required output: ${task.output}
Quality criteria: ${task.criteria}
Evaluation guide: ${task.eval}

━━━ FOUNDER'S JOURNEY SO FAR ━━━
${allDel || "(No deliverables yet)"}

${existingDel ? `━━━ EXISTING DELIVERABLE (revisiting) ━━━\n${existingDel}` : ""}

${memoryContext ? `━━━ MEMORY & CONTEXT ━━━\n${memoryContext}` : ""}

━━━ RULES ━━━
1. First message with no conversation → deliver this intro: ${adaptedIntro}
2. After response → evaluate against output + criteria.
3. Incomplete → name good + missing.
4. Vague → push for specifics${personality ? ` (${personality.workStyle} style prefers specific examples)` : ''}.
5. Off-topic → redirect: "Let's focus. I need: ${task.output}"
6. COMPLETE → praise + deliverable + completion tag.
7. Reference previous deliverables when relevant.
8. CONCISE. 2-4 paragraphs.
${personality ? `9. Use ${tone?.style || 'balanced'} communication style based on user's ${personality.learning} learning preference.` : ''}
${personality && pacing ? `10. Remember user prefers ${pacing.timeframe} pacing - ${pacing.reminder}` : ''}

COMPLETION FORMAT (ONLY when all criteria met):
[DELIVERABLE_START]
(2-4 sentence summary of their work)
[DELIVERABLE_END]
[TASK_COMPLETE]`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    const data = await response.json();
    
    // Extract response text
    const responseText = data.content?.[0]?.text || "";
    const hasDeliverable = responseText.includes('[DELIVERABLE_START]');
    const isComplete = responseText.includes('[TASK_COMPLETE]');
    
    // Update memory based on the interaction
    if (messages.length > 1) { // Not the first message
      // Track patterns if user seems stuck
      const userMessage = messages[messages.length - 1].content;
      if (userMessage.toLowerCase().includes("don't understand") || 
          userMessage.toLowerCase().includes("confused") ||
          userMessage.toLowerCase().includes("help")) {
        memory = updatePatterns(memory, "stickingPoints", `${task.title}: ${userMessage.slice(0, 100)}`);
      }
      
      // Track success patterns
      if (isComplete) {
        memory = updatePatterns(memory, "successPatterns", `Completed ${task.title} in ${messages.length} messages`);
      }
    }
    
    // Add milestone if task completed
    if (isComplete) {
      memory = addMilestone(memory, `Completed: ${task.title}`, project?.id);
      
      // Update project memory
      memory = updateProjectMemory(memory, project?.id, {
        lastCompletedTask: task.id,
        lastCompletedTaskTitle: task.title,
        progress: {
          ...memory.projects[project?.id]?.progress,
          [step.id]: taskIdx + 1
        }
      });
    }
    
    // Look for insights in the conversation
    if (responseText.includes("breakthrough") || 
        responseText.includes("excellent insight") ||
        responseText.includes("that's the key")) {
      const insightMatch = responseText.match(/[.!]([^.!]+(?:breakthrough|excellent|key)[^.!]+)[.!]/i);
      if (insightMatch) {
        memory = addInsight(memory, insightMatch[1].trim(), {
          task: task.id,
          projectId: project?.id,
          importance: "high"
        });
      }
    }
    
    // Save updated memory
    await saveUserMemory(userId, memory);
    
    // Log user activity for admin tracking
    await logUserActivity(userId, project?.id, {
      type: 'message',
      stage: stepId,
      task: task.id,
      taskTitle: task.title,
      projectName: project?.name,
      messageCount: messages.length,
      hasDeliverable,
      isComplete
    });
    
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: "API call failed" }, { status: 500 });
  }
}

# FounderForge Memory System Documentation

## Overview
The memory system provides intelligent context persistence, conversation memory, and pattern recognition to enhance the mentoring experience. It tracks user progress, captures insights, and helps the AI mentor provide more personalized and contextual guidance.

## Features

### 1. Core Memory Components

#### User Profile Memory
- **Goals**: Tracks user's stated objectives
- **Challenges**: Records recurring difficulties  
- **Strengths**: Identifies areas of competence
- **Preferences**: Stores user preferences
- **Background**: Maintains relevant background information

#### Project Memory
- **Per-project context**: Separate memory for each project
- **Key learnings**: Important discoveries per project
- **Challenges faced**: Project-specific obstacles
- **Progress tracking**: Detailed progress through tasks

#### Insights System
- **Automatic capture**: Detects breakthroughs in conversations
- **Importance levels**: Marks high-importance insights
- **Context preservation**: Links insights to specific tasks
- **Historical access**: Maintains last 50 insights

#### Decision Tracking
- **Key decisions**: Records important choices made
- **Reasoning capture**: Stores why decisions were made
- **Outcome tracking**: Can update with results later
- **Project linking**: Associates decisions with projects

#### Pattern Recognition
- **Sticking points**: Identifies where users commonly struggle
- **Success patterns**: Recognizes what leads to task completion
- **Frequency tracking**: Counts pattern occurrences
- **Top patterns**: Maintains top 10 most frequent patterns

#### Milestone System
- **Achievement tracking**: Records completed tasks and goals
- **Celebration status**: Tracks which milestones were acknowledged
- **Project association**: Links milestones to specific projects
- **Recent focus**: Keeps last 20 milestones

### 2. Memory Dashboard UI

Access the Memory Dashboard by clicking the "🧠 Memory & Insights" button in the top bar.

#### Overview Tab
- **Statistics**: Active projects, total insights, decisions, milestones
- **Recent achievements**: Latest completed milestones
- **Quick health check**: Memory system status

#### Insights Tab  
- **Chronological view**: Latest insights with timestamps
- **Importance highlighting**: High-importance insights marked
- **Context preservation**: Shows related task/project

#### Milestones Tab
- **Achievement timeline**: All completed milestones
- **Celebration status**: Celebrated vs uncelebrated
- **Date tracking**: When each was achieved

#### Patterns Tab
- **Common challenges**: Frequently encountered difficulties
- **Success patterns**: What consistently works
- **Frequency indicators**: How often patterns occur

### 3. Memory Integration with Chat

The memory system automatically:
- **Provides context**: Shares relevant memories with the AI mentor
- **Tracks interactions**: Updates patterns based on conversations
- **Captures insights**: Detects and stores breakthrough moments
- **Records progress**: Updates project memory with completions

### 4. Memory Management

#### Automatic Features
- **Auto-pruning**: Removes stale data older than 1 month
- **Size management**: Monitors memory size (warns at 500KB)
- **Duplicate prevention**: Avoids storing duplicate insights
- **Pattern consolidation**: Merges similar patterns

#### Manual Controls
- **Export memory**: Download full memory as JSON
- **Clean up**: Manually prune old/irrelevant data
- **Clear sections**: Reset specific memory sections
- **Import backup**: Restore from exported memory

## API Endpoints

### `/api/memory`

#### GET Parameters
- `?action=context&projectId=X&taskId=Y` - Get relevant context
- `?action=summary` - Get memory statistics
- `?action=health` - Check memory health status
- `?action=export` - Export full memory

#### POST Actions
- `updateProject` - Update project-specific memory
- `addInsight` - Add new insight
- `recordDecision` - Record key decision
- `updatePattern` - Update pattern tracking
- `addMilestone` - Add achievement milestone
- `sessionSummary` - Create session summary
- `updateProfile` - Update user profile
- `prune` - Clean up old memory

#### DELETE Sections
- `?section=project&projectId=X` - Clear project memory
- `?section=insights` - Clear all insights
- `?section=decisions` - Clear all decisions
- `?section=patterns` - Clear all patterns
- `?section=sessions` - Clear session history
- `?section=all` - Reset entire memory

## Memory Context in Chat

The chat system receives:
1. **User background** and goals
2. **Recent insights** (last 5, high importance)
3. **Project-specific learnings**
4. **Recurring challenges** (frequency > 2)
5. **Recent decisions** and their reasoning

This context helps the AI mentor:
- Reference previous discoveries
- Avoid repeating solved problems
- Build on established knowledge
- Provide continuity across sessions

## Privacy & Data Management

- **Local storage**: All memory stored in `/data/memory/`
- **User-specific**: Each user has separate memory file
- **Export capability**: Users can download their data
- **Clear option**: Users can reset memory anytime
- **No external sharing**: Memory stays on your server

## Benefits

1. **Continuity**: Maintains context across sessions
2. **Personalization**: Adapts to user's specific journey
3. **Pattern awareness**: Identifies what helps/hinders progress
4. **Achievement tracking**: Celebrates milestones
5. **Learning optimization**: Builds on previous insights
6. **Progress visibility**: Shows growth over time

## Usage Tips

1. **Regular reviews**: Check Memory Dashboard weekly
2. **Export backups**: Download memory before major changes
3. **Prune periodically**: Clean up irrelevant data monthly
4. **Celebrate milestones**: Acknowledge achievements
5. **Learn from patterns**: Use pattern insights to improve

## Technical Implementation

- **File-based storage**: JSON files in `/data/memory/`
- **Automatic tracking**: Integrated with chat API
- **Pattern matching**: Regex-based insight detection
- **Frequency counting**: Tracks pattern occurrences
- **Size limits**: Maintains reasonable memory size
- **Pruning logic**: Age and importance-based cleanup

The memory system transforms FounderForge from a stateless mentor to an intelligent companion that remembers your journey, learns from your patterns, and provides increasingly personalized guidance.
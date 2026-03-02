#!/usr/bin/env node

/**
 * Migration script to move file-based data to PostgreSQL database
 * Run with: node scripts/migrate-to-db.js
 */

const fs = require('fs').promises;
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

// Directories containing file-based data
const USERS_DIR = path.join(process.cwd(), '.data', 'users');
const PERSONALITIES_DIR = path.join(process.cwd(), 'data', 'personalities');
const MEMORY_DIR = path.join(process.cwd(), 'data', 'memory');
const ADMIN_DIR = path.join(process.cwd(), '.data', 'admin');
const ACTIVITIES_DIR = path.join(ADMIN_DIR, 'activities');

async function migrateUsers() {
  console.log('📦 Migrating users and projects...');
  
  try {
    const files = await fs.readdir(USERS_DIR);
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const userId = file.replace('.json', '');
      const filePath = path.join(USERS_DIR, file);
      
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const userData = JSON.parse(content);
        
        // Decode email from filename
        const email = userId.replace(/_/g, '@').replace(/@@/g, '.');
        
        console.log(`  → Migrating user: ${email}`);
        
        // Create or update user
        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: {
            email,
            name: userData.name || email.split('@')[0],
          },
        });
        
        // Migrate projects
        if (userData.projects && Array.isArray(userData.projects)) {
          for (const project of userData.projects) {
            await prisma.project.upsert({
              where: { id: project.id },
              update: {
                name: project.name,
                completedTasks: project.completedTasks || {},
                deliverables: project.deliverables || {},
              },
              create: {
                id: project.id,
                name: project.name,
                userId: user.id,
                completedTasks: project.completedTasks || {},
                deliverables: project.deliverables || {},
              },
            });
            
            // Migrate task messages (conversations)
            if (project.taskMessages) {
              for (const [taskId, messages] of Object.entries(project.taskMessages)) {
                const conversation = await prisma.conversation.upsert({
                  where: {
                    projectId_taskId: {
                      projectId: project.id,
                      taskId,
                    },
                  },
                  update: {},
                  create: {
                    projectId: project.id,
                    taskId,
                  },
                });
                
                // Add messages to conversation
                for (const msg of messages) {
                  await prisma.message.create({
                    data: {
                      conversationId: conversation.id,
                      role: msg.role,
                      content: msg.content,
                    },
                  });
                }
              }
            }
          }
        }
        
        console.log(`    ✓ Migrated ${userData.projects?.length || 0} projects`);
      } catch (error) {
        console.error(`    ✗ Error migrating ${userId}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error reading users directory:', error);
  }
}

async function migratePersonalities() {
  console.log('🧠 Migrating personality profiles...');
  
  try {
    const files = await fs.readdir(PERSONALITIES_DIR);
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const filePath = path.join(PERSONALITIES_DIR, file);
      
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(content);
        
        if (!data.userEmail) continue;
        
        console.log(`  → Migrating personality for: ${data.userEmail}`);
        
        // Find user
        const user = await prisma.user.findUnique({
          where: { email: data.userEmail },
        });
        
        if (!user) {
          console.log(`    ⚠ User not found, skipping`);
          continue;
        }
        
        // Create or update personality
        await prisma.personality.upsert({
          where: { userId: user.id },
          update: {
            workStyle: data.personality?.workStyle || null,
            experience: data.personality?.experience || null,
            motivation: data.personality?.motivation || null,
            learning: data.personality?.learning || null,
            pace: data.personality?.pace || null,
            completed: data.completed || false,
          },
          create: {
            userId: user.id,
            workStyle: data.personality?.workStyle || null,
            experience: data.personality?.experience || null,
            motivation: data.personality?.motivation || null,
            learning: data.personality?.learning || null,
            pace: data.personality?.pace || null,
            completed: data.completed || false,
          },
        });
        
        console.log(`    ✓ Migrated personality`);
      } catch (error) {
        console.error(`    ✗ Error migrating personality:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error reading personalities directory:', error);
  }
}

async function migrateMemory() {
  console.log('💾 Migrating memory data...');
  
  try {
    const files = await fs.readdir(MEMORY_DIR);
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const filePath = path.join(MEMORY_DIR, file);
      
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(content);
        
        // Extract email from filename
        const emailPart = file.replace('_memory.json', '');
        const email = emailPart.replace(/_/g, '@').replace(/@@/g, '.');
        
        console.log(`  → Migrating memory for: ${email}`);
        
        // Find user
        const user = await prisma.user.findUnique({
          where: { email },
        });
        
        if (!user) {
          console.log(`    ⚠ User not found, skipping`);
          continue;
        }
        
        // Create or update memory
        const memory = await prisma.memory.upsert({
          where: { userId: user.id },
          update: {
            profile: data.profile || {},
            lastActive: new Date(data.lastActive || Date.now()),
          },
          create: {
            userId: user.id,
            profile: data.profile || {},
            lastActive: new Date(data.lastActive || Date.now()),
          },
        });
        
        // Migrate insights
        if (data.insights && Array.isArray(data.insights)) {
          for (const insight of data.insights) {
            await prisma.insight.create({
              data: {
                memoryId: memory.id,
                content: insight.content,
                context: insight.context || {},
                importance: insight.importance || 'normal',
              },
            });
          }
        }
        
        // Migrate milestones
        if (data.milestones && Array.isArray(data.milestones)) {
          for (const milestone of data.milestones) {
            await prisma.milestone.create({
              data: {
                memoryId: memory.id,
                milestone: milestone.milestone,
                projectId: milestone.projectId,
                celebrated: milestone.celebrated || false,
              },
            });
          }
        }
        
        // Migrate decisions
        if (data.decisions && Array.isArray(data.decisions)) {
          for (const decision of data.decisions) {
            await prisma.decision.create({
              data: {
                memoryId: memory.id,
                decision: decision.decision,
                reasoning: decision.reasoning,
                projectId: decision.projectId,
                outcome: decision.outcome,
              },
            });
          }
        }
        
        // Migrate patterns
        if (data.patterns) {
          for (const [type, patterns] of Object.entries(data.patterns)) {
            if (!Array.isArray(patterns)) continue;
            
            for (const pattern of patterns) {
              await prisma.pattern.create({
                data: {
                  memoryId: memory.id,
                  type,
                  pattern: pattern.pattern || pattern,
                  frequency: pattern.frequency || 1,
                },
              });
            }
          }
        }
        
        console.log(`    ✓ Migrated memory data`);
      } catch (error) {
        console.error(`    ✗ Error migrating memory:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error reading memory directory:', error);
  }
}

async function migrateActivities() {
  console.log('📊 Migrating activity logs...');
  
  try {
    const files = await fs.readdir(ACTIVITIES_DIR);
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const filePath = path.join(ACTIVITIES_DIR, file);
      
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const activities = JSON.parse(content);
        
        console.log(`  → Migrating activities from: ${file}`);
        
        for (const activity of activities) {
          // Extract email from userId
          const email = activity.userId.replace(/_/g, '@').replace(/@@/g, '.');
          
          // Find user
          const user = await prisma.user.findUnique({
            where: { email },
          });
          
          if (!user) continue;
          
          await prisma.activity.create({
            data: {
              userId: user.id,
              type: activity.type,
              projectId: activity.projectId,
              stage: activity.stage,
              task: activity.task,
              details: activity,
              createdAt: new Date(activity.timestamp || Date.now()),
            },
          });
        }
        
        console.log(`    ✓ Migrated ${activities.length} activities`);
      } catch (error) {
        console.error(`    ✗ Error migrating activities:`, error.message);
      }
    }
  } catch (error) {
    console.error('Error reading activities directory:', error);
  }
}

async function main() {
  console.log('🚀 Starting migration to PostgreSQL database...\n');
  
  try {
    await migrateUsers();
    console.log();
    
    await migratePersonalities();
    console.log();
    
    await migrateMemory();
    console.log();
    
    await migrateActivities();
    console.log();
    
    console.log('✅ Migration completed successfully!');
    console.log('\n📝 Note: File-based data has been preserved. You can delete it manually after verifying the migration.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🚀 FounderForge Admin Setup\n');

const envPath = path.join(process.cwd(), '.env.local');

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
  try {
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      console.log('✓ Found existing .env.local file\n');
    } else {
      console.log('⚠️  No .env.local file found. Creating one...\n');
    }
    
    const adminEmails = await question('Enter admin email addresses (comma-separated): ');
    
    if (adminEmails) {
      const emails = adminEmails.split(',').map(e => e.trim()).filter(e => e);
      
      if (emails.length > 0) {
        // Update or add ADMIN_EMAILS
        if (envContent.includes('ADMIN_EMAILS=')) {
          envContent = envContent.replace(/ADMIN_EMAILS=.*/g, `ADMIN_EMAILS=${emails.join(',')}`);
        } else {
          envContent += `\n# Admin Configuration\nADMIN_EMAILS=${emails.join(',')}\n`;
        }
        
        // Update or add NEXT_PUBLIC_ADMIN_EMAILS
        if (envContent.includes('NEXT_PUBLIC_ADMIN_EMAILS=')) {
          envContent = envContent.replace(/NEXT_PUBLIC_ADMIN_EMAILS=.*/g, `NEXT_PUBLIC_ADMIN_EMAILS=${emails.join(',')}`);
        } else {
          envContent += `NEXT_PUBLIC_ADMIN_EMAILS=${emails.join(',')}\n`;
        }
        
        fs.writeFileSync(envPath, envContent);
        
        console.log('\n✅ Admin configuration added successfully!');
        console.log('\nAdmin emails configured:');
        emails.forEach(email => console.log(`  - ${email}`));
        console.log('\n📌 Next steps:');
        console.log('1. Restart your development server (npm run dev)');
        console.log('2. Sign in with one of the admin emails');
        console.log('3. Navigate to /admin to access the dashboard');
      } else {
        console.log('\n⚠️  No valid email addresses provided');
      }
    } else {
      console.log('\n⚠️  No email addresses provided');
    }
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

setup();
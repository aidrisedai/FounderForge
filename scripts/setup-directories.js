#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function setupDirectories() {
  const directories = [
    '.data/users',
    'data/personalities', 
    'data/memory',
    'data/admin'
  ];

  console.log('📁 Setting up data directories...\n');

  for (const dir of directories) {
    const fullPath = path.join(process.cwd(), dir);
    try {
      await fs.mkdir(fullPath, { recursive: true });
      console.log(`✅ Created: ${dir}`);
    } catch (error) {
      console.log(`⚠️  Already exists: ${dir}`);
    }
  }

  // Create .gitignore for data directories
  const gitignoreContent = `# User data
*.json

# Keep directories
!.gitkeep
`;

  for (const dir of directories) {
    const gitignorePath = path.join(process.cwd(), dir, '.gitignore');
    try {
      await fs.writeFile(gitignorePath, gitignoreContent);
      console.log(`✅ Added .gitignore to ${dir}`);
    } catch (error) {
      console.log(`⚠️  .gitignore already exists in ${dir}`);
    }
  }

  console.log('\n✨ Setup complete! Your data directories are ready.');
  console.log('\n📝 Note: User data will be automatically created as users interact with the app.');
}

setupDirectories().catch(console.error);
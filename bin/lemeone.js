#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const appDir = path.resolve(__dirname, '..');
const args = process.argv.slice(2);

/**
 * Handle "skills" command
 */
function handleSkills() {
  const subCommand = args[1];
  const targetUrl = args[2];

  if (subCommand === 'add' && targetUrl) {
    console.log(`\n📦 Adding skill from: ${targetUrl}`);
    const skillsDir = path.join(appDir, 'skills');
    
    if (!fs.existsSync(skillsDir)) {
      fs.mkdirSync(skillsDir);
    }

    // Extract skill name from URL
    const skillName = targetUrl.split('/').pop().replace('.git', '');
    const destPath = path.join(skillsDir, skillName);

    if (fs.existsSync(destPath)) {
      console.log(`⚠️  Skill "${skillName}" already exists. Updating...`);
      try {
        execSync('git pull', { cwd: destPath, stdio: 'inherit' });
        console.log(`✅ Updated ${skillName}`);
      } catch (e) {
        console.error(`❌ Failed to update ${skillName}: ${e.message}`);
      }
    } else {
      try {
        console.log(`🚚 Cloning into ${destPath}...`);
        execSync(`git clone ${targetUrl} ${skillName}`, { cwd: skillsDir, stdio: 'inherit' });
        console.log(`✅ Successfully added skill: ${skillName}`);
      } catch (e) {
        console.error(`❌ Failed to add skill: ${e.message}`);
      }
    }
    process.exit(0);
  } else {
    console.log('\nUsage:');
    console.log('  npx lemeone-lab skills add <github-url>');
    console.log('  npx skills add <github-url>');
    process.exit(1);
  }
}

/**
 * Handle "hook" command
 */
function handleHook() {
  const subCommand = args[1];
  const hookPath = path.join(appDir, '.git', 'hooks', 'prepare-commit-msg');

  if (subCommand === 'install') {
    console.log('\n⚓ Installing Lemeone Strategic Git Hook...');
    const hookContent = `#!/bin/sh\nnode "${path.join(appDir, 'scripts', 'git-hook-audit.js')}" "$1"`;
    
    try {
      fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
      console.log('✅ Git hook installed successfully at .git/hooks/prepare-commit-msg');
      console.log('✨ Your next commit will include a strategic gravity brief!\n');
    } catch (e) {
      console.error(`❌ Failed to install hook: ${e.message}`);
    }
    process.exit(0);
  } else {
    console.log('\nUsage:');
    console.log('  npx lemeone-lab hook install');
    process.exit(1);
  }
}

// Route commands
if (args[0] === 'skills') {
  handleSkills();
} else if (args[0] === 'hook') {
  handleHook();
} else {
  // Default: Start Server
  console.log('🚀 Starting Lemeone-lab 2.0 Local Engine...');

  // 1. Check GOOGLE_GENERATIVE_AI_API_KEY
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    console.log('\n⚠️  WARNING: GOOGLE_GENERATIVE_AI_API_KEY is not set in your environment.');
    console.log('   The simulation requires Google Gemini Flash to generate events.');
    console.log('   Please export GOOGLE_GENERATIVE_AI_API_KEY="your-key" and run again.\n');
  }

  // 2. Initialize Database
  console.log('📦 Initializing local SQLite database...');
  try {
    execSync('npx prisma db push', { cwd: appDir, stdio: 'inherit' });
  } catch (e) {
    console.error('❌ Failed to initialize database.');
    process.exit(1);
  }

  // 3. Start Next.js Server
  console.log('🌐 Starting local server...');
  const server = spawn('npm', ['run', 'dev'], { cwd: appDir, stdio: 'inherit' });

  // 4. Open browser after a short delay
  setTimeout(() => {
    const url = 'http://localhost:3000';
    console.log(`\n✨ Lemeone-lab is running at ${url}\n`);
    const openCmd = os.platform() === 'win32' ? 'start' : os.platform() === 'darwin' ? 'open' : 'xdg-open';
    try {
      execSync(`${openCmd} ${url}`);
    } catch (e) {}
  }, 3000);

  server.on('close', (code) => {
    process.exit(code);
  });
}

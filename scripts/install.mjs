#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = join(__dirname, '..');

function runCommand(command, cwd) {
  console.log(`\n📦 Running: ${command}`);
  console.log(`📁 In: ${cwd}`);
  try {
    execSync(command, { 
      cwd, 
      stdio: 'inherit',
      env: { ...process.env }
    });
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    process.exit(1);
  }
}

console.log('🚀 Starting Vercel build process...\n');

// Install frontend dependencies
const frontendDir = join(rootDir, 'frontend');
runCommand('npm install', frontendDir);

// Install sanity dependencies  
const sanityDir = join(rootDir, 'sanity');
runCommand('npm install', sanityDir);

console.log('\n✅ All dependencies installed!');

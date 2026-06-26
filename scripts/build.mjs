#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { cpSync, existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = join(__dirname, '..');

function runCommand(command, cwd) {
  console.log(`\n🏗️  Running: ${command}`);
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

console.log('🚀 Starting build process...\n');

// Build frontend
const frontendDir = join(rootDir, 'frontend');
runCommand('npm run build', frontendDir);

// Build sanity
const sanityDir = join(rootDir, 'sanity');
runCommand('npm run build', sanityDir);

const frontendDistPath = join(frontendDir, 'dist');

// Copy Sanity Studio to frontend dist
console.log('\n📦 Copying Sanity Studio to frontend dist...');
const sanityDistPath = join(sanityDir, 'dist');
const sanityTargetPath = join(frontendDistPath, 'sanity');

if (!existsSync(frontendDistPath)) {
  console.error('❌ Frontend dist directory does not exist');
  process.exit(1);
}

if (!existsSync(sanityDistPath)) {
  console.error('❌ Sanity dist directory does not exist');
  process.exit(1);
}

if (!existsSync(sanityTargetPath)) {
  mkdirSync(sanityTargetPath, { recursive: true });
}

cpSync(sanityDistPath, sanityTargetPath, { recursive: true });
console.log('✅ Sanity Studio copied successfully!');

console.log('\n🎉 Build complete!');



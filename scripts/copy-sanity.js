import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { cpSync, existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = dirname(__dirname);
const sanityDistPath = join(rootDir, 'sanity', 'dist');
const frontendDistPath = join(rootDir, 'frontend', 'dist');
const targetPath = join(frontendDistPath, 'sanity');

console.log('Copying Sanity Studio to frontend dist...');
console.log('Source:', sanityDistPath);
console.log('Target:', targetPath);

// Ensure frontend dist exists
if (!existsSync(frontendDistPath)) {
  console.error('Frontend dist directory does not exist. Build frontend first.');
  process.exit(1);
}

// Ensure sanity dist exists
if (!existsSync(sanityDistPath)) {
  console.error('Sanity dist directory does not exist. Build sanity first.');
  process.exit(1);
}

// Create target directory if it doesn't exist
if (!existsSync(targetPath)) {
  mkdirSync(targetPath, { recursive: true });
}

// Copy Sanity Studio build to frontend/dist/sanity
cpSync(sanityDistPath, targetPath, { recursive: true });

console.log('✓ Sanity Studio copied successfully!');

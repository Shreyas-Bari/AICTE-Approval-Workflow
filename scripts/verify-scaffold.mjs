#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- Verifying AICTE Project Scaffold Structure ---');

const expectedPaths = [
  'package.json',
  '.gitignore',
  '.editorconfig',
  'README.md',
  'docs/project-baseline/README_FINAL_PACKAGE.md',
  'frontend/package.json',
  'frontend/vite.config.ts',
  'frontend/tsconfig.json',
  'frontend/index.html',
  'frontend/src/main.tsx',
  'frontend/src/App.tsx',
  'backend/package.json',
  'backend/tsconfig.json',
  'backend/.env.example',
  'backend/src/app.ts',
  'backend/src/server.ts',
  'backend/prisma/schema.prisma'
];

let missing = 0;
for (const relPath of expectedPaths) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`[MISSING] ${relPath}`);
    missing++;
  } else {
    console.log(`[OK] ${relPath}`);
  }
}

if (missing === 0) {
  console.log('\nAll expected scaffold paths exist.');
} else {
  console.error(`\nVerification failed: ${missing} path(s) missing.`);
  process.exit(1);
}

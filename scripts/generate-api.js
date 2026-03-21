#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configPath = path.join(__dirname, '../heyapi.config.ts');
const outputDir = path.join(__dirname, '../src/api/generated');

console.log('🚀 Generating API client...');
console.log(`Config: ${configPath}`);
console.log(`Output: ${outputDir}`);

const child = spawn('npx', [
  '@hey-api/openapi-ts@latest',
  'generate',
  '--input', 'http://localhost:3001/api-docs/swagger.json',
  '--output', outputDir,
  '--client', 'axios',
  '--plugin', 'typescript',
  '--plugin', '@tanstack/react-query'
], {
  stdio: 'inherit',
  shell: true
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('✅ API client generated successfully!');
    
    // Format with prettier
    const prettier = spawn('npx', ['prettier', '--write', `${outputDir}/**/*.{ts,tsx}`], {
      stdio: 'inherit',
      shell: true
    });
    
    prettier.on('close', (prettierCode) => {
      if (prettierCode === 0) {
        console.log('✅ Generated files formatted with Prettier');
      } else {
        console.log('⚠️  Prettier formatting failed');
      }
    });
  } else {
    console.error(`❌ API generation failed with code ${code}`);
    process.exit(1);
  }
});

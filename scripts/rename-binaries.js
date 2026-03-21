#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BIN_DIR = path.join(__dirname, '../src-tauri/bin');

const BINARY_MAPPINGS = {
  'server-win.exe': 'backend-x86_64-pc-windows-msvc.exe',
  'server-macos': 'backend-x86_64-apple-darwin',
  'server-macos-arm': 'backend-aarch64-apple-darwin',
  'server-linux': 'backend-x86_64-unknown-linux-gnu'
};

function renameBinaries() {
  console.log('Renaming backend binaries...');
  
  const files = fs.readdirSync(BIN_DIR);
  
  for (const [oldName, newName] of Object.entries(BINARY_MAPPINGS)) {
    const oldPath = path.join(BIN_DIR, oldName);
    const newPath = path.join(BIN_DIR, newName);
    
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      console.log(`✅ Renamed: ${oldName} -> ${newName}`);
    } else {
      console.log(`⚠️  File not found: ${oldName}`);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  renameBinaries();
}

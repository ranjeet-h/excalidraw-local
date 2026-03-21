#!/usr/bin/env node

/**
 * Build the Node.js backend into a standalone executable using esbuild + Node SEA.
 *
 * Builds for the current platform only — run on each target OS for cross-platform.
 *
 *   node scripts/build-backend.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.join(__dirname, '..');
const BIN_DIR = path.join(ROOT, 'src-tauri', 'bin');
const DIST_DIR = path.join(ROOT, 'backend', 'dist');
const BACKEND_ENTRY = path.join(ROOT, 'backend', 'src', 'server.ts');
const BUNDLE_OUTPUT = path.join(DIST_DIR, 'server.cjs');

function getCurrentTriplet() {
  const { arch, platform } = process;
  if (platform === 'darwin' && arch === 'arm64') return 'aarch64-apple-darwin';
  if (platform === 'darwin' && arch === 'x64') return 'x86_64-apple-darwin';
  if (platform === 'win32' && arch === 'x64') return 'x86_64-pc-windows-msvc';
  if (platform === 'linux' && arch === 'x64') return 'x86_64-unknown-linux-gnu';
  throw new Error(`Unsupported platform: ${platform}-${arch}`);
}

// Step 1: Bundle with esbuild into a single CJS file
function bundleBackend() {
  console.log('📦 Step 1/3: Bundling backend with esbuild...');
  fs.mkdirSync(DIST_DIR, { recursive: true });

  execSync(
    [
      'npx esbuild',
      JSON.stringify(BACKEND_ENTRY),
      '--bundle',
      '--platform=node',
      '--target=node20',
      '--format=cjs',
      `--outfile=${JSON.stringify(BUNDLE_OUTPUT)}`,
      // Keep native addons external — they'll be resolved from node_modules in SEA
      // mongoose's pure-JS driver works fine bundled
    ].join(' '),
    { cwd: ROOT, stdio: 'inherit' },
  );

  const size = (fs.statSync(BUNDLE_OUTPUT).size / 1024).toFixed(0);
  console.log(`  ✅ Bundled (${size} KB)\n`);
}

// Step 2: Generate SEA blob
function generateBlob() {
  console.log('🔧 Step 2/3: Generating SEA blob...');

  const blobPath = path.join(DIST_DIR, 'sea-prep.blob');
  const seaConfig = {
    main: BUNDLE_OUTPUT,
    output: blobPath,
    disableExperimentalSEAWarning: true,
    useSnapshot: false,
    useCodeCache: true,
  };

  const configPath = path.join(DIST_DIR, 'sea-config.json');
  fs.writeFileSync(configPath, JSON.stringify(seaConfig, null, 2));

  execSync(`node --experimental-sea-config ${JSON.stringify(configPath)}`, {
    cwd: ROOT,
    stdio: 'inherit',
  });

  const size = (fs.statSync(blobPath).size / 1024 / 1024).toFixed(1);
  console.log(`  ✅ Blob generated (${size} MB)\n`);

  return blobPath;
}

// Step 3: Create executable by injecting blob into a copy of the node binary
function createExecutable(blobPath) {
  const triplet = getCurrentTriplet();
  const ext = process.platform === 'win32' ? '.exe' : '';
  const outputName = `backend-${triplet}${ext}`;
  const outputPath = path.join(BIN_DIR, outputName);

  console.log(`🔨 Step 3/3: Creating executable → ${outputName}`);

  fs.mkdirSync(BIN_DIR, { recursive: true });

  // Copy the current node binary
  fs.copyFileSync(process.execPath, outputPath);
  fs.chmodSync(outputPath, '755');

  const FUSE = 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2';

  if (process.platform === 'darwin') {
    try {
      execSync(`codesign --remove-signature ${JSON.stringify(outputPath)}`, { stdio: 'pipe' });
    } catch {
      // fine if not signed
    }
    execSync(
      `npx postject ${JSON.stringify(outputPath)} NODE_SEA_BLOB ${JSON.stringify(blobPath)} --sentinel-fuse ${FUSE} --macho-segment-name NODE_SEA`,
      { cwd: ROOT, stdio: 'inherit' },
    );
    execSync(`codesign --sign - ${JSON.stringify(outputPath)}`, { stdio: 'inherit' });
  } else {
    execSync(
      `npx postject ${JSON.stringify(outputPath)} NODE_SEA_BLOB ${JSON.stringify(blobPath)} --sentinel-fuse ${FUSE}`,
      { cwd: ROOT, stdio: 'inherit' },
    );
  }

  const size = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1);
  console.log(`  ✅ ${outputName} (${size} MB)\n`);
}

try {
  bundleBackend();
  const blobPath = generateBlob();
  createExecutable(blobPath);
  console.log('🎉 Backend build complete!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

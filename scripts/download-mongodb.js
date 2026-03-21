#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_VERSION = '7.0.14';
const BIN_DIR = path.join(__dirname, '../src-tauri/bin');

const MONGODB_DOWNLOADS = {
  'x86_64-pc-windows-msvc': {
    url: `https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-${MONGODB_VERSION}.zip`,
    extractCmd: 'powershell -Command "Expand-Archive -Path {archive} -DestinationPath {dest}"',
    binaryPath: `mongodb-windows-x86_64-${MONGODB_VERSION}/bin/mongod.exe`,
    targetName: 'mongod-x86_64-pc-windows-msvc.exe',
  },
  'x86_64-apple-darwin': {
    url: `https://fastdl.mongodb.org/osx/mongodb-macos-x86_64-${MONGODB_VERSION}.tgz`,
    extractCmd: 'tar -xzf {archive} -C {dest}',
    binaryPath: `mongodb-macos-x86_64-${MONGODB_VERSION}/bin/mongod`,
    targetName: 'mongod-x86_64-apple-darwin',
  },
  'aarch64-apple-darwin': {
    url: `https://fastdl.mongodb.org/osx/mongodb-macos-arm64-${MONGODB_VERSION}.tgz`,
    extractCmd: 'tar -xzf {archive} -C {dest}',
    binaryPath: `mongodb-macos-aarch64-${MONGODB_VERSION}/bin/mongod`,
    targetName: 'mongod-aarch64-apple-darwin',
  },
  'x86_64-unknown-linux-gnu': {
    url: `https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2204-${MONGODB_VERSION}.tgz`,
    extractCmd: 'tar -xzf {archive} -C {dest}',
    binaryPath: `mongodb-linux-x86_64-ubuntu2204-${MONGODB_VERSION}/bin/mongod`,
    targetName: 'mongod-x86_64-unknown-linux-gnu',
  },
};

function getCurrentTriplet() {
  const arch = process.arch;
  const platform = process.platform;
  if (platform === 'darwin' && arch === 'arm64') return 'aarch64-apple-darwin';
  if (platform === 'darwin' && arch === 'x64') return 'x86_64-apple-darwin';
  if (platform === 'win32' && arch === 'x64') return 'x86_64-pc-windows-msvc';
  if (platform === 'linux' && arch === 'x64') return 'x86_64-unknown-linux-gnu';
  throw new Error(`Unsupported platform: ${platform}-${arch}`);
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const request = (currentUrl) => {
      https.get(currentUrl, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          request(response.headers.location);
          return;
        }
        if (response.statusCode !== 200) {
          reject(new Error(`Download failed with status ${response.statusCode} from ${currentUrl}`));
          return;
        }
        const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
        let downloaded = 0;
        const file = fs.createWriteStream(dest);
        response.on('data', (chunk) => {
          downloaded += chunk.length;
          if (totalBytes > 0) {
            const pct = ((downloaded / totalBytes) * 100).toFixed(1);
            process.stdout.write(`\r  Progress: ${pct}% (${(downloaded / 1024 / 1024).toFixed(1)} MB)`);
          }
        });
        response.pipe(file);
        file.on('finish', () => {
          process.stdout.write('\n');
          file.close(resolve);
        });
      }).on('error', reject);
    };
    request(url);
  });
}

async function extractArchive(archivePath, dest, extractCmd) {
  const cmd = extractCmd
    .replace('{archive}', archivePath)
    .replace('{dest}', dest);
  await execAsync(cmd);
}

async function downloadForPlatform(triplet) {
  const config = MONGODB_DOWNLOADS[triplet];
  if (!config) throw new Error(`No MongoDB download config for triplet: ${triplet}`);

  const targetBinary = path.join(BIN_DIR, config.targetName);

  if (fs.existsSync(targetBinary)) {
    const stat = fs.statSync(targetBinary);
    if (stat.size > 1000) {
      console.log(`⏭️  ${config.targetName} already exists (${(stat.size / 1024 / 1024).toFixed(1)} MB), skipping.`);
      return;
    }
  }

  console.log(`📥 Downloading MongoDB ${MONGODB_VERSION} for ${triplet}...`);

  const fileName = path.basename(config.url);
  const archivePath = path.join(BIN_DIR, fileName);
  const extractDir = path.join(BIN_DIR, 'temp_extract');

  await downloadFile(config.url, archivePath);

  fs.mkdirSync(extractDir, { recursive: true });
  console.log('  Extracting...');
  await extractArchive(archivePath, extractDir, config.extractCmd);

  const sourceBinary = path.join(extractDir, config.binaryPath);
  if (!fs.existsSync(sourceBinary)) {
    // List what was actually extracted for debugging
    const { stdout } = await execAsync(`find "${extractDir}" -name "mongod*" -type f 2>/dev/null || dir /s /b "${extractDir}\\*mongod*" 2>NUL`);
    throw new Error(`Binary not found at ${sourceBinary}. Found: ${stdout.trim()}`);
  }

  fs.copyFileSync(sourceBinary, targetBinary);
  fs.chmodSync(targetBinary, '755');

  fs.rmSync(archivePath, { force: true });
  fs.rmSync(extractDir, { recursive: true, force: true });

  const finalSize = (fs.statSync(targetBinary).size / 1024 / 1024).toFixed(1);
  console.log(`✅ ${config.targetName} ready (${finalSize} MB)`);
}

async function main() {
  const args = process.argv.slice(2);
  const downloadAll = args.includes('--all');

  fs.mkdirSync(BIN_DIR, { recursive: true });

  try {
    if (downloadAll) {
      console.log('Downloading MongoDB for ALL platforms...\n');
      for (const triplet of Object.keys(MONGODB_DOWNLOADS)) {
        await downloadForPlatform(triplet);
      }
    } else {
      const triplet = getCurrentTriplet();
      console.log(`Downloading MongoDB for current platform: ${triplet}\n`);
      await downloadForPlatform(triplet);
    }

    console.log('\n🎉 MongoDB setup complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

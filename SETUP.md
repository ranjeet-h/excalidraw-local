# Complete Tauri + Node.js + MongoDB Setup Guide

This guide walks you through setting up a complete Tauri application with Node.js backend and MongoDB sidecar processes.

## 🏗️ Architecture Overview

The application consists of:
- **Frontend**: React + Vite + TypeScript (runs in Tauri webview)
- **Backend**: Node.js + Express + TypeScript (compiled to standalone binary)
- **Database**: MongoDB (standalone binary as sidecar process)
- **Desktop App**: Tauri Rust core that orchestrates everything

## 📋 Prerequisites

### Required Tools
- **Node.js 18+** - Runtime for development and backend compilation
- **Rust & Cargo** - For Tauri core compilation
- **MongoDB** - For local development (optional, bundled in production)
- **UPX** (optional) - For binary compression

### Install UPX for Binary Compression
```bash
# macOS
brew install upx

# Ubuntu/Debian
sudo apt-get install upx

# Windows
# Download from https://upx.github.io/
```

## 🛠️ Installation Steps

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd vite-tauri-node-rust-templete
npm install
```

### 2. Environment Setup
```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit as needed (MongoDB URI, ports, etc.)
```

### 3. Development Setup

#### Option A: Full Stack Development (Recommended)
```bash
npm run dev
```
This starts:
- MongoDB on port 27017 (data stored in `./local_dev_data`)
- Node.js backend on port 3001 with hot reload
- React frontend on port 5173 with Vite HMR
- Tauri development mode

#### Option B: Individual Services
```bash
# Start MongoDB only
npm run dev:db

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend

# Start Tauri dev (requires external services)
npm run tauri dev
```

### 4. Production Build

#### Complete Build Process
```bash
npm run build
```

This process:
1. Builds React frontend (`npm run build:frontend`)
2. Compiles Node.js backend to binaries (`npm run build:backend`)
3. Downloads and renames MongoDB binaries (`npm run setup:binaries`)
4. Builds Tauri application with sidecars (`tauri build`)

#### Individual Build Steps
```bash
# Build frontend only
npm run build:frontend

# Build backend binaries only
npm run build:backend

# Setup MongoDB binaries only
npm run setup:binaries

# Build Tauri app only (requires binaries to exist)
npm run tauri build
```

## 📁 Binary Structure

After running `npm run build`, the `src-tauri/bin` directory contains:

### MongoDB Binaries
- `mongod-x86_64-pc-windows-msvc.exe` - Windows 64-bit
- `mongod-x86_64-apple-darwin` - macOS Intel
- `mongod-aarch64-apple-darwin` - macOS Apple Silicon
- `mongod-x86_64-unknown-linux-gnu` - Linux 64-bit (glibc)

### Backend Binaries
- `backend-x86_64-pc-windows-msvc.exe` - Windows 64-bit
- `backend-x86_64-apple-darwin` - macOS Intel
- `backend-aarch64-apple-darwin` - macOS Apple Silicon
- `backend-x86_64-unknown-linux-gnu` - Linux 64-bit

## 🚀 Production Deployment

### Binary Distribution
The final Tauri installer includes:
- Your React application
- Node.js backend binary
- MongoDB binary
- All dependencies bundled

### Runtime Behavior
When the installed application starts:

1. **Tauri Core** initializes
2. **Database Directory** created in user's app data folder
3. **MongoDB** started as sidecar process:
   - Database stored in user's app data directory
   - Binds to localhost only (127.0.0.1)
   - Uses journaling for data integrity
4. **Node.js Backend** started as sidecar process:
   - Serves API on port 3001
   - Connects to MongoDB instance
5. **React Frontend** loads in Tauri webview:
   - Communicates with backend via HTTP
   - Accesses local filesystem through Tauri APIs

## 🔧 Configuration

### Backend Configuration (`backend/.env`)
```env
PORT=3001
NODE_ENV=production
MONGODB_URI=mongodb://localhost:27017/vite-tauri-app
FRONTEND_URL=http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SWAGGER_ENABLED=false  # Disabled in production
```

### Tauri Configuration (`src-tauri/tauri.conf.json`)
- External binaries defined in `bundle.externalBin`
- Sidecar processes managed in `src-tauri/src/lib.rs`
- Conditional compilation for dev vs production

## 🔍 Development vs Production

### Development Mode
- Uses external MongoDB instance
- Uses Node.js with nodemon for hot reload
- Sidecar processes are disabled via `#[cfg(debug_assertions)]`
- Swagger documentation enabled at `/api-docs`

### Production Mode
- Uses bundled MongoDB binary
- Uses compiled Node.js binary
- Sidecar processes spawned by Tauri
- Swagger documentation disabled
- All processes managed by Tauri lifecycle

## 🐛 Troubleshooting

### Common Issues

#### MongoDB Binary Issues
```bash
# Check if MongoDB binary exists and is executable
ls -la src-tauri/bin/mongod-*
file src-tauri/bin/mongod-*
```

#### Backend Binary Issues
```bash
# Check if backend binary exists and is executable
ls -la src-tauri/bin/backend-*
file src-tauri/bin/backend-*
```

#### Permission Issues
```bash
# Make binaries executable
chmod +x src-tauri/bin/*
```

#### Port Conflicts
- Ensure ports 27017 (MongoDB) and 3001 (Backend) are available
- Check with `lsof -i :27017` and `lsof -i :3001`

#### Build Issues
```bash
# Clean build artifacts
rm -rf src-tauri/bin
rm -rf dist
rm -rf backend/dist

# Rebuild
npm run build
```

## 📚 API Documentation

### Development
- Available at `http://localhost:3001/api-docs`
- Interactive Swagger UI
- Full API documentation

### Production
- Disabled by default for security
- Can be enabled by setting `SWAGGER_ENABLED=true`

## 🔒 Security Considerations

### Network Security
- MongoDB binds to 127.0.0.1 only (localhost)
- Backend accessible only from application
- No external network exposure

### Data Security
- Database stored in user's app data directory
- Proper file permissions on all platforms
- Journaling enabled for data integrity

### Application Security
- Content Security Policy configured
- Tauri capabilities limited to required permissions
- No shell access to system commands

## 📱 Platform-Specific Notes

### Windows
- Binaries use `.exe` extension
- Uses Windows subsystem for proper console handling
- UAC considerations for installation

### macOS
- Universal binaries for Intel and Apple Silicon
- Code signing required for distribution
- Gatekeeper considerations

### Linux
- glibc-based binaries for maximum compatibility
- AppImage/DEB/RPM package generation
- SELinux considerations

## 🚀 Performance Optimizations

### Binary Compression
- UPX used to reduce binary sizes
- ~50% size reduction typical
- Slightly longer startup time (acceptable trade-off)

### Database Optimization
- Journaling enabled for durability
- Localhost binding for performance
- Appropriate cache settings

### Startup Optimization
- Parallel process spawning
- Efficient path resolution
- Minimal dependency loading

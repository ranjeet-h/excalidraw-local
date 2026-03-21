# Vite Tauri Node Rust Template

A full-stack template combining Vite, React, Tauri, and Node.js with Express, MongoDB, and TypeScript.

## 🚀 Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development
- **Tailwind CSS v4** for styling
- **shadcn/ui** components with Radix UI
- **Tauri** for desktop app development

### Backend
- **Node.js** runtime
- **Express.js** with TypeScript
- **MongoDB** with Mongoose ODM
- **Swagger/OpenAPI** documentation
- **CORS** and compression middleware
- **Rate limiting** and security headers

### DevTools & Code Generation
- **HeyAPI OpenAPI TS** for type-safe API client generation
- **ESLint** and **Prettier** for code quality
- **Hot reload** in development
- **Concurrently** for running frontend and backend together

## 📁 Project Structure

```
├── backend/                 # Express backend
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Backend services
│   │   └── server.ts       # Main server file
│   ├── .env.example        # Environment variables template
│   └── tsconfig.json       # TypeScript configuration
├── src/                    # React frontend
│   ├── api/               # API clients and generated types
│   ├── components/        # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   └── App.tsx            # Main React component
├── heyapi.config.ts       # HeyAPI configuration
└── package.json           # Central package management
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vite-tauri-node-rust-templete
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   ```

4. **MongoDB setup**
   - Make sure MongoDB is running on your system
   - Update the `MONGODB_URI` in `backend/.env` if needed

## 🚀 Development

### Start both servers
```bash
npm run dev
```
This will start:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- API Documentation: http://localhost:3001/api-docs

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only the frontend
- `npm run dev:backend` - Start only the backend
- `npm run build` - Build both frontend and backend
- `npm run build:frontend` - Build only the frontend
- `npm run build:backend` - Build only the backend
- `npm run start` - Start the production server
- `npm run swagger:generate` - Generate Swagger documentation
- `npm run api:generate` - Generate type-safe API client
- `npm run lint` - Run ESLint

## 📚 API Documentation

Once the backend is running, visit http://localhost:3001/api-docs to explore the interactive Swagger documentation.

## 🔧 Code Generation with HeyAPI

This template uses HeyAPI to generate type-safe API clients from your OpenAPI specification.

### How HeyAPI Works

1. **Generate OpenAPI Spec**: The backend automatically generates OpenAPI documentation from route comments
2. **Generate Client**: Run `npm run api:generate` to create type-safe client code
3. **Use in Frontend**: Import and use the generated client in your React components

### Example Usage

```typescript
import { createClient } from './api/generated';

const client = createClient();

// Get all users
const users = await client.getUsers();

// Create a new user
const newUser = await client.createUser({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123'
});
```

## 🏗️ Architecture

### Backend Architecture

- **Models**: Mongoose schemas with validation and indexing
- **Services**: Business logic layer for data operations
- **Routes**: Express route handlers with validation middleware
- **Middleware**: Error handling, CORS, security, and logging
- **Configuration**: Environment-based configuration management

### Frontend Architecture

- **Components**: Reusable UI components with shadcn/ui
- **Hooks**: Custom React hooks for state management
- **API**: Type-safe client generated from OpenAPI spec
- **Styling**: Tailwind CSS with shadcn/ui theme

## 🎨 UI Components

The template includes a comprehensive set of shadcn/ui components:
- Buttons, inputs, forms
- Navigation and layout components
- Data display components
- Modals and overlays
- Charts and visualizations

## 📱 Mobile Development

While this template focuses on desktop applications with Tauri, the React frontend can be adapted for mobile development using frameworks like Capacitor or React Native.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔧 Environment Variables

### Backend (.env)

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/vite-tauri-app

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Swagger Configuration
SWAGGER_ENABLED=true
```

## 🚀 Deployment

### Backend Deployment

1. Build the backend: `npm run build:backend`
2. Set production environment variables
3. Start the server: `npm start`

### Frontend Deployment

1. Build the frontend: `npm run build:frontend`
2. Deploy the `dist` folder to your hosting service

### Tauri App

1. Build the Tauri app: `npm run tauri build`
2. The executable will be in the `src-tauri/target/release/bundle` directory
# excalidraw-local

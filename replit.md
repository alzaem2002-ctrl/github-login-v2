# منصة علوم الذكية (OJudge Educational Platform)

## Overview
An Arabic educational coding platform for science teachers built with React, TypeScript, and Express. The platform allows students to solve programming problems related to science concepts and uses AI for intelligent code evaluation.

## Project Status
✅ **Complete MVP with AI Integration** - Ready for use

## Features
- **Arabic RTL Interface** - Full right-to-left support with Cairo font
- **Dark Mode** - Toggle between light and dark themes
- **Authentication System** - Secure session-based authentication
- **Student Dashboard** - View problems, track progress, see statistics
- **Problem Solving** - Code editor with AI-powered evaluation
- **Admin Dashboard** - Manage students, view submissions, track statistics
- **Gemini AI Integration** - Intelligent code evaluation and hints
- **Notion Integration** - Sync problems and save results to Notion

## Pre-configured Science Problems
1. **احسب الكثافة (Density)** - Easy - `density(mass, volume)` returns mass ÷ volume
2. **قانون أوم (Ohm's Law)** - Medium - `voltage(current, resistance)` returns V = I × R
3. **الطاقة الحركية (Kinetic Energy)** - Hard - `kinetic_energy(mass, velocity)` returns 0.5 × m × v²

## Admin Credentials
- **Username:** ostaz_science
- **Password:** SecurePass2025!

## Tech Stack
- **Frontend:** React, TypeScript, TanStack Query, Wouter, Tailwind CSS, shadcn/ui
- **Backend:** Express.js, TypeScript, Express-Session
- **AI:** Google Gemini AI for code evaluation and hints
- **Integration:** Notion API for data sync
- **Styling:** Cairo font (Arabic), JetBrains Mono (code), RTL layout

## Project Structure
```
├── client/
│   ├── src/
│   │   ├── components/     # UI components (navbar, theme-toggle)
│   │   ├── lib/            # Auth context, theme provider, query client
│   │   ├── pages/          # Login, Register, Dashboard, Problem, Admin
│   │   └── App.tsx         # Main app with routing
│   └── index.html          # HTML entry with Cairo font
├── server/
│   ├── index.ts            # Express server with session middleware
│   ├── routes.ts           # API routes with auth middleware
│   ├── storage.ts          # In-memory storage with pre-configured data
│   └── services/
│       ├── gemini.ts       # Gemini AI integration
│       └── notion.ts       # Notion API integration
├── shared/
│   └── schema.ts           # TypeScript types and Zod schemas
└── design_guidelines.md    # Design system documentation
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/register` - Register new student account
- `POST /api/auth/logout` - Logout and destroy session
- `GET /api/auth/session` - Check current session

### Problems
- `GET /api/problems` - Get all problems
- `GET /api/problems/:id` - Get specific problem

### Submissions
- `POST /api/submit` - Submit code for evaluation (requires auth)
- `GET /api/submissions/:userId` - Get user's submissions (requires auth)

### AI (Gemini)
- `POST /api/ai/evaluate` - AI-powered code evaluation (requires auth)
- `POST /api/ai/hint` - Get AI hint for problem (requires auth)
- `POST /api/ai/generate-problem` - Generate new problem with AI (admin only)

### Notion
- `GET /api/notion/test` - Test Notion connection (admin only)
- `GET /api/notion/databases` - Get Notion databases (admin only)
- `POST /api/notion/sync-problems` - Sync problems from Notion (admin only)
- `POST /api/notion/save-submission` - Save submission to Notion (admin only)
- `POST /api/notion/create-problem` - Create problem in Notion (admin only)

### Admin
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/submissions` - Get all submissions (admin only)

## Environment Variables
- `SESSION_SECRET` - Secret key for session encryption
- `GEMINI_API_KEY` - Google Gemini API key for AI features
- `NOTION_API_KEY` - Notion API key for data sync

## Running the Application
The application runs automatically with `npm run dev` on port 5000.

## Security
- Session-based authentication with httpOnly cookies
- Role-based access control (student/admin)
- Protected routes require authentication
- Admin routes require admin role

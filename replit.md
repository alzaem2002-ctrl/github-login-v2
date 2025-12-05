# منصة علوم الذكية (OJudge Educational Platform)

## Overview
An Arabic educational coding platform for science teachers built with React, TypeScript, and Express. The platform allows students to solve programming problems related to science concepts (physics formulas) and teachers to manage students and track progress.

## Project Status
✅ **Complete MVP** - Ready for use

## Features
- **Arabic RTL Interface** - Full right-to-left support with Cairo font
- **Dark Mode** - Toggle between light and dark themes
- **Authentication System** - Secure session-based authentication
- **Student Dashboard** - View problems, track progress, see statistics
- **Problem Solving** - Code editor with test case validation
- **Admin Dashboard** - Manage students, view submissions, track statistics

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
│   └── storage.ts          # In-memory storage with pre-configured data
├── shared/
│   └── schema.ts           # TypeScript types and Zod schemas
└── design_guidelines.md    # Design system documentation
```

## API Endpoints
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/register` - Register new student account
- `POST /api/auth/logout` - Logout and destroy session
- `GET /api/problems` - Get all problems
- `GET /api/problems/:id` - Get specific problem
- `POST /api/submit` - Submit code for evaluation (requires auth)
- `GET /api/submissions/:userId` - Get user's submissions (requires auth)
- `GET /api/admin/users` - Get all users (admin only)
- `GET /api/admin/submissions` - Get all submissions (admin only)

## Running the Application
The application runs automatically with `npm run dev` on port 5000.

## Security
- Session-based authentication with httpOnly cookies
- Role-based access control (student/admin)
- Protected routes require authentication
- Admin routes require admin role

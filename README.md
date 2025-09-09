# Ialogus Clinics Frontend

## Overview

Frontend application for Ialogus Clinics - Medical Appointment Management System. Built with React, TypeScript, and shadcn-ui.

## Technologies

- **Vite** - Build tool and development server
- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **shadcn-ui** - Component library based on Radix UI
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Tanstack Query** - Data fetching and caching
- **React Hook Form** - Form management with Zod validation
- **Socket.io Client** - Real-time communication
- **Zustand** - State management

## Prerequisites

- Node.js 18+ and npm/pnpm
- Backend API running (ialogus-backend)

## Installation

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd ialogus-clinics-frontend

# Install dependencies
npm install
# or
pnpm install
```

## Environment Setup

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Configure the environment variables:

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

## Development

```bash
# Start development server
npm run dev
# or
pnpm run dev

# Server will be available at http://localhost:5173
```

## Building

```bash
# Build for production
npm run build
# or
pnpm run build

# Build for development
npm run build:dev
# or
pnpm run build:dev

# Preview production build
npm run preview
# or
pnpm run preview
```

## Linting

```bash
# Run ESLint
npm run lint
# or
pnpm run lint
```

## Project Structure

```
src/
├── components/       # React components
│   ├── ui/          # shadcn-ui components
│   └── ...          # Custom components
├── hooks/           # Custom React hooks
├── lib/            # Utility functions and libraries
├── pages/          # Page components
├── services/       # API services
├── stores/         # Zustand stores
├── styles/         # Global styles
└── types/          # TypeScript type definitions
```

## Features

- Medical appointment scheduling
- Patient management
- Doctor and staff management
- Real-time chat integration
- Calendar integration
- Responsive design
- Dark mode support

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

Private - All rights reserved
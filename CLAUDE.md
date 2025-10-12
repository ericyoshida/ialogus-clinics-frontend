# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ialogus Clinics Frontend is a medical appointment management system built with React 18, TypeScript, and Vite. It provides a multi-company platform for managing medical appointments, patient interactions, automated agents (AI assistants), WhatsApp channels, and conversation flows.

## Development Commands

```bash
# Install dependencies (pnpm preferred, npm also supported)
pnpm install

# Start development server (runs on http://localhost:5173)
pnpm run dev

# Build for production
pnpm run build

# Build for development
pnpm run build:dev

# Preview production build
pnpm run preview

# Lint code with ESLint
pnpm run lint
```

## Environment Configuration

Required environment variables in `.env`:
- `VITE_API_URL`: Backend API base URL (default: https://ialogus-backend-deploy.onrender.com)
- `VITE_WS_URL`: WebSocket base URL (default: https://ialogus-backend-deploy.onrender.com)

For local development, point both to `http://localhost:3000`.

## Architecture

### Routing and Multi-Clinic Structure

The application uses React Router with a clinic-scoped architecture. Most routes are nested under `/dashboard/clinic/:clinicId/` to support multi-tenancy. The routing structure includes:

- **Authentication routes**: `/auth/login`, `/auth/register`, `/auth/forgot-password`
- **Protected routes**: All dashboard routes require authentication via `<ProtectedRoute>`
- **Clinic-scoped routes**: Most features are accessible via `/dashboard/clinic/:clinicId/{feature}`

Key route patterns:
- Agents: `/dashboard/clinic/:clinicId/agents`
- Contacts: `/dashboard/clinic/:clinicId/contacts`
- Channels: `/dashboard/clinic/:clinicId/channels`
- Conversations: `/dashboard/clinic/:clinicId/conversations`
- Calendar: `/dashboard/clinic/:clinicId/calendar`
- Bulk messages: `/dashboard/clinic/:clinicId/messages/bulk/*`

Legacy routes without `clinicId` are maintained for backward compatibility but new features should use clinic-scoped routes.

### Context Providers

The app uses three main context providers wrapping the dashboard layout:

1. **AuthContext** (`src/contexts/AuthContext.tsx`): Manages user authentication state, login/logout, and token management. Stores auth data in localStorage with keys `ialogus:token` and `ialogus:user`.

2. **ClinicContext** (`src/contexts/ClinicContext.tsx`): Manages the list of clinics the user has access to and tracks the currently selected clinic. Auto-selects the first clinic if none is selected.

3. **ConversationContext** (`src/contexts/ConversationContext.tsx`): Manages conversation/chat state (not read in this analysis but mentioned in App.tsx).

### API and Services Layer

API configuration is centralized in `src/config/api.ts` with configurable base URLs via environment variables.

The main API client (`src/services/api.ts`) exports:
- Default axios instance with authentication interceptors
- Automatic token injection from localStorage
- 401 error handling (auto-logout and redirect)
- `ApiService` class with typed methods for conversation flowchart operations

Service modules in `src/services/`:
- `auth.ts`: Authentication operations
- `clinics.ts`: Clinic management
- `agents.ts`: AI agent management
- `channels.ts`: Communication channel management
- `chats.ts`: Chat operations
- `customers.ts`: Customer/patient management
- `calendar.ts`: Calendar and appointment operations
- `bulkMessages.ts`: Bulk messaging operations
- `websocket.ts`: Real-time WebSocket service (see below)

### Real-time Communication (WebSocket)

WebSocket service (`src/services/websocket.ts`) is a singleton that manages Socket.IO connections:
- Connects to `/chat` namespace
- Handles authentication via token in connection auth
- Room-based architecture: clients join chat rooms via `join-chat-room` event
- Key events: `new-message`, `message-sent`, `connection-established`, `whatsapp-service-window-status`
- Automatic reconnection with room re-joining
- Tab visibility detection to optimize connections
- Manual ping/pong mechanism to keep connections alive

When working with chat features, always use the existing `webSocketService` instance exported from this module.

### Multi-Step Workflows

The application includes several multi-step wizards:

1. **Agent Creation** (`/dashboard/clinic/:clinicId/agents/create/*`):
   - Select agent type → conversation flow → product catalog → additional info → success

2. **Channel Creation** (`/dashboard/clinic/:clinicId/channels/create/*`):
   - Select channel type → select agents → Meta connection → callback → success

3. **Bulk Message Sending** (`/dashboard/clinic/:clinicId/messages/bulk/*`):
   - Select channel → agent → template → contacts → results

These workflows maintain state across pages, typically using query parameters or React state management.

### State Management

- **React Context**: Used for global state (auth, clinic, conversations)
- **Tanstack Query**: Used for server state management, data fetching, and caching
- **Zustand**: Listed as dependency but not extensively used in analyzed files
- **Local Storage**: Used for persisting auth tokens and user data

### UI Components

Uses shadcn-ui component library (Radix UI primitives + Tailwind CSS):
- Components are in `src/components/ui/`
- Custom utility function `cn()` from `src/lib/utils.ts` for class merging
- Theming support via `next-themes`
- Custom toast notifications with multiple systems (Sonner + custom)

### Flow Editor

The conversation flow editor (`src/pages/conversations/FlowEditorPage`) is a complex feature using:
- Visual flowchart builder for conversation sequences
- Message blocks with conditional logic (positive/negative paths)
- Data collection fields configuration
- Template-based flow creation support
- Integration with `ApiService` for CRUD operations on flowcharts and message blocks

## Key Technical Patterns

- **File-based routing**: Page components are in `src/pages/` organized by feature
- **Hook composition**: Custom hooks in `src/hooks/` encapsulate business logic
- **Service layer**: API calls abstracted into service modules
- **Type safety**: Extensive TypeScript usage with interfaces for API responses
- **Error handling**: Centralized in API interceptors with toast notifications
- **Code splitting**: React lazy loading not heavily used yet but supported by Vite

## Important Development Notes

- Always include clinic context when building new features
- WebSocket connections should be managed carefully - don't create multiple instances
- Auth tokens are stored with `ialogus:` prefix in localStorage
- The backend expects Bearer token authentication
- When working with routes, prefer clinic-scoped paths over legacy routes

# Overview

This is a tracking system application built with a full-stack architecture using React/TypeScript for the frontend and Express.js with Node.js for the backend. The application manages package tracking codes with features for entry, finalization, and status management. It's designed as a warehouse or logistics management tool where users can input tracking codes and manage their processing status through different stages.

**Production Ready**: The application is now fully configured for production deployment with Docker containerization, automated deployment scripts, and VPS hosting capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack React Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Styling**: Tailwind CSS with CSS variables for theming and design tokens

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API design with JSON communication
- **Database Access**: Drizzle ORM for type-safe database operations
- **Validation**: Zod schemas shared between frontend and backend for consistent validation
- **Error Handling**: Centralized error middleware with structured error responses

## Database Design
- **Database**: PostgreSQL with Neon serverless connection
- **ORM**: Drizzle ORM with migrations support
- **Schema**: Two main entities:
  - Users table with username/password authentication
  - Trackings table with tracking codes, status management, and metadata
- **Status Management**: Enum-based status system (PENDENTE, TC_FINALIZADO, CANCELADO, DIVERGENCIA)

## Development Environment
- **Monorepo Structure**: Client and server code in separate directories with shared schemas
- **Development Server**: Vite dev server with HMR for frontend, tsx for backend development
- **Build Process**: Vite for frontend bundling, esbuild for backend compilation
- **Type Safety**: Shared TypeScript types between frontend and backend via shared directory

## Production Environment
- **Containerization**: Docker multi-stage build with optimized production image
- **Orchestration**: Docker Compose with PostgreSQL, application, and optional Nginx
- **Security**: Production-hardened session management, secure cookies, health checks
- **Deployment**: Automated deployment scripts with backup, rollback capabilities
- **Monitoring**: Health check endpoints, structured logging, and container monitoring

## Key Design Decisions
- **Shared Schema Approach**: Common validation and type definitions in `/shared` directory eliminates type drift between frontend and backend
- **Component-First UI**: Leverages Shadcn/ui for consistent, accessible components with Radix UI primitives
- **Serverless-Ready Database**: Uses Neon PostgreSQL for serverless deployment compatibility
- **Query-Based State**: TanStack React Query handles all server state, eliminating need for global state management
- **Form-Centric UX**: Heavy use of React Hook Form with Zod for robust form handling and validation

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL database with WebSocket support for edge environments
- **Connection Pooling**: Built-in connection pooling via Neon's serverless driver

## UI and Styling
- **Radix UI**: Headless UI primitives for accessibility and behavior
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: SVG icon library for consistent iconography
- **Google Fonts**: Inter font family for typography

## Development Tools
- **Vite**: Frontend build tool with HMR and plugin ecosystem
- **TypeScript**: Type checking and development experience
- **ESBuild**: Fast JavaScript bundler for backend builds
- **Drizzle Kit**: Database migration and schema management tools

## Runtime Libraries
- **React Query**: Server state management and caching
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and schema parsing
- **Date-fns**: Date manipulation and formatting utilities
- **Wouter**: Lightweight routing for single-page application navigation

# Production Deployment

## Docker Configuration
- **Multi-stage Dockerfile**: Optimized for production with builder and runtime stages
- **Security**: Non-root user, minimal base image, health checks
- **Environment**: Production-specific configurations and secrets management

## Deployment Files
- `Dockerfile`: Container configuration for the application
- `docker-compose.yml`: Service orchestration with PostgreSQL and optional Nginx
- `deploy.sh`: Automated deployment script with backup and health checks
- `setup-vps.sh`: VPS initial configuration script
- `backup-db.sh`: Database backup utility
- `nginx.conf`: Reverse proxy configuration with SSL and rate limiting
- `.env.example`: Environment variables template
- `README-DEPLOY.md`: Complete deployment documentation

## Key Features
- **Automated Backup**: Database backup before deployments
- **Health Monitoring**: Application and database health checks
- **SSL Ready**: Nginx configuration with SSL/TLS support
- **Rate Limiting**: Protection against abuse
- **Log Management**: Structured logging and rotation
- **Security Headers**: OWASP recommended security headers
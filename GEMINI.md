# GEMINI.md

This file provides context and guidance for Gemini when working with code in this repository.

## Project Overview

TableMate is a Next.js 16 application for creating curated menu experiences. It features group-based dish management, event planning with guest invitations, democratic dessert voting, and post-event feedback.

### Key Features

- **Group-Based Authorization**: Users organize into groups to share dish libraries and events.
- **Dish Library**: Manage dishes with images, categories, and recipes. Supports progressive loading and filtering.
- **Event Management**: Create events, select menus (appetizers, mains, desserts), and invite guests.
- **Guest Experience**: No-account access via magic links for RSVP, meal selection, and feedback.
- **Feedback System**: Guests rate dishes (thumbs up/down) and provide comments after events.

## Development Workflow

### specific 'just' commands
A `justfile` is included to simplify common commands. Ensure `just` is installed.

```bash
just dev            # Start local Supabase and Next.js dev server
just up             # Start local Supabase services
just down           # Stop local Supabase services
just reset          # Reset local database (wipes data, re-runs migrations/seeds)
just test-e2e       # Run core E2E workflow test (Critical for verification)
just load-dishes <id> # Load sample data into a group
```

> **Note:** Once the local Supabase service is up (`just up`), use **`just test-e2e`** to verify the main functions of the application (User A/B/C flows, dish visibility, guest RSVP, feedback).

### Standard Commands

```bash
# Development
npm run dev              # Start dev server at http://localhost:3000
npm run build            # Production build
npm start                # Start production server
npm run lint             # Run ESLint

# Testing
npm test                 # Run Playwright tests (headless)
npm run test:ui          # Interactive test UI
npm run test:local       # Run tests against local Supabase stack
```

### Local Supabase (Docker)

The project uses a local Supabase stack for development.

```bash
# Start/Stop
npm run supabase:start    # Start local containers
npm run supabase:stop     # Stop containers

# Database Management
npm run supabase:reset    # Reset DB, run migrations, and seed
npm run supabase:migrate  # Run pending migrations
npm run supabase:status   # View service URLs and keys
```

**Services:**
- App: http://localhost:3000
- Supabase Studio: http://127.0.0.1:54323
- Mailpit: http://127.0.0.1:54324

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth (Google OAuth) + Custom Magic Links
- **Testing**: Playwright

### Directory Structure
- `app/`: Next.js App Router pages and API routes.
    - `host/`: Protected host dashboard (Dish library, Event management).
    - `guest/`: Public guest pages (RSVP, Feedback) protected by magic tokens.
    - `api/`: API endpoints (Auth callbacks).
- `components/`: React components.
    - `host/`: Components specific to host functionality.
    - `guest/`: Components specific to guest functionality.
- `lib/supabase/`: Supabase client configurations.
    - `server.ts`: Server components (cookies).
    - `client.ts`: Client components (browser).
    - `groups.ts`: Group management helpers.
- `supabase/migrations/`: Database migrations.

### Authentication & Data
- **Hosts**: Authenticated via Google OAuth. Data access is controlled by Group membership and RLS policies.
- **Guests**: Authenticated via `magic_token` (URL param). Actions validated server-side against the token.
- **Groups**: Central authorization unit. Users have a "Personal" group by default but can create/join others.
- **Images**: Stored in Supabase Storage (`dish-images` bucket).

## Coding Conventions

- **Supabase Clients**: Use specific clients for the context (`server.ts` for Server Components/Actions, `client.ts` for Client Components).
- **Server Actions**: Use for mutations, especially for Guest actions where RLS is bypassed securely using the service role key to validate tokens.
- **Type Safety**: strict TypeScript usage. Database types are generated in `types/database.ts`.
- **Styling**: Tailwind CSS for all styling.

## Testing Guidelines

- Run tests before major changes: `npm test`.
- Use `test:local` to verify changes against the isolated local environment.
- Tests are located in `tests/`.

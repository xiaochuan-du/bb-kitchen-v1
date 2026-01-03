# Local Development with Supabase (Docker)

This guide covers setting up and using the local Supabase development environment for TableMate.

## Overview

The local development stack runs a complete Supabase instance in Docker, providing:
- Full environment isolation from production
- Instant database resets for testing
- Local email testing via Mailpit
- No cloud dependencies during development

## Prerequisites

- **Docker Desktop** - Running and with sufficient resources allocated
- **Node.js 18+** - For running the Next.js app and Supabase CLI

## Quick Start

```bash
# 1. Start the local Supabase stack (first run downloads ~1GB of Docker images)
npm run supabase:start

# 2. Start Next.js dev server with local Supabase
npm run dev:local

# 3. Open the app
open http://localhost:3000
```

## Local Services

Once running, you have access to these local services:

| Service | URL | Description |
|---------|-----|-------------|
| **App** | http://localhost:3000 | Your Next.js application |
| **Supabase Studio** | http://127.0.0.1:54323 | Database GUI, auth management |
| **API (REST)** | http://127.0.0.1:54321/rest/v1 | PostgREST API |
| **API (GraphQL)** | http://127.0.0.1:54321/graphql/v1 | GraphQL endpoint |
| **Mailpit** | http://127.0.0.1:54324 | Email testing inbox |
| **Database** | postgresql://postgres:postgres@127.0.0.1:54322/postgres | Direct Postgres connection |

## NPM Scripts

```bash
# Development
npm run dev:local          # Start Next.js with local Supabase env vars

# Testing
npm run test:local         # Run Playwright tests against local Supabase

# Supabase Management
npm run supabase:start     # Start all Docker containers
npm run supabase:stop      # Stop containers (preserves data in Docker volumes)
npm run supabase:status    # Show service URLs and connection info
npm run supabase:reset     # Reset DB, re-run migrations, re-seed data

# Database Operations
npm run supabase:migrate   # Apply pending migrations
npm run supabase:diff      # Generate migration from schema changes
npm run supabase:generate-types  # Regenerate TypeScript types from local DB
```

## Environment Files

| File | Purpose | Git Status |
|------|---------|------------|
| `.env.local.docker` | Local development credentials | Tracked (safe defaults) |
| `.env.local` | Active environment (auto-created) | Ignored |

The `dev:local` and `test:local` scripts automatically copy `.env.local.docker` to `.env.local`.

## Database Migrations

Migrations are stored in `supabase/migrations/` with timestamp prefixes:

```
supabase/migrations/
├── 20240101000000_initial_schema.sql    # Base tables, RLS, triggers, storage
└── 20240101000001_add_groups.sql        # Group-based authorization
```

### Applying Migrations

```bash
# Reset database and run all migrations (recommended for clean state)
npm run supabase:reset

# Apply only pending migrations (preserves data)
npm run supabase:migrate
```

### Creating New Migrations

```bash
# After making changes in Supabase Studio, generate a migration:
npm run supabase:diff

# This creates a new file in supabase/migrations/
# Review and rename appropriately, then commit
```

## Testing Workflows

### End-to-End Testing with Environment Isolation

```bash
# Run full test suite against local Supabase
npm run test:local

# Run specific test file
cp .env.local.docker .env.local && npx playwright test tests/landing-page.spec.ts

# Interactive test UI
cp .env.local.docker .env.local && npm run test:ui
```

### Core Workflow E2E Test

The `tests/e2e/group-workflow.spec.ts` test validates the most critical user flows:

| Test | Description |
|------|-------------|
| User A sees dishes | Group owner can view dishes in shared group |
| User B sees dishes | Group member can view dishes in shared group |
| User C cannot see dishes | Non-member is blocked by RLS policies |
| Dish image visible | Dish images load correctly on the guest menu |
| Guest RSVP flow | Guest accesses invite link, selects main course & dessert vote |
| Guest selections recorded | Database correctly stores guest choices |
| Guest feedback flow | Guest accesses feedback link, rates dishes, submits comments |
| Guest feedback recorded | Database correctly stores ratings and comments |

#### Running the E2E Test

```bash
# Ensure local Supabase is running
npm run supabase:start

# Run the E2E test
cp .env.local.docker .env.local && npx playwright test tests/e2e/group-workflow.spec.ts
```

#### Interactive Test Modes

```bash
# UI Mode - Visual test runner with time-travel debugging (recommended)
npx playwright test tests/e2e/group-workflow.spec.ts --ui

# Headed Mode - Watch tests run in a visible browser
npx playwright test tests/e2e/group-workflow.spec.ts --headed

# Debug Mode - Step through tests with Playwright Inspector
npx playwright test tests/e2e/group-workflow.spec.ts --debug

# Run a single test by name
npx playwright test tests/e2e/group-workflow.spec.ts --ui --grep "Guest can access invite"
```

#### Test Architecture

The E2E test uses these fixtures in `tests/fixtures/`:

- **`supabase-admin.ts`** - Admin client for user/group creation (bypasses RLS)
- **`test-data.ts`** - Generates test dishes, events, and guests
- **`auth-helpers.ts`** - Authenticates test users via `/api/auth/test-login`

The test creates 3 users (A, B, C), a shared group, dishes, an event, and a guest - all programmatically. After tests complete, cleanup removes all test data.

### Database Reset Between Test Runs

```bash
# Clean slate for each test session
npm run supabase:reset
```

### Testing Email Flows

1. Trigger an email action in the app (password reset, etc.)
2. Open Mailpit at http://127.0.0.1:54324
3. View received emails in the inbox

## Working with Supabase Studio

Supabase Studio (http://127.0.0.1:54323) provides:

- **Table Editor** - View and edit data directly
- **SQL Editor** - Run queries and test migrations
- **Authentication** - Manage users, view sessions
- **Storage** - Browse uploaded files
- **Logs** - View real-time logs from all services

### Creating Test Users

1. Open Supabase Studio → Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter email and password
4. User will have a profile and personal group auto-created via trigger

## Loading Test Data

The project includes a script to load sample dishes from JSON files. This is useful for populating the database with test data.

### Prerequisites

- Local Supabase running (`npm run supabase:start`)
- Environment configured (`cp .env.local.docker .env.local`)
- A group ID (see steps below)

### Step 1: Create a Test User and Group

First, create a test user which auto-creates a personal group:

1. Open **Supabase Studio** at http://127.0.0.1:54323
2. Go to **Authentication → Users → Add user → Create new user**
3. Enter:
   - Email: `test@example.com`
   - Password: `testpass123`
4. Click "Create user"

The database trigger automatically creates:
- A profile for the user
- A personal group ("[Name]'s Kitchen")

### Step 2: Get the Group ID

Query the database for the group ID:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT id, name FROM groups;"
```

Or view it in Supabase Studio → Table Editor → groups.

### Step 3: Run the Load Script

```bash
# Replace <group_id> with the UUID from step 2
npm run load-dishes <group_id>

# Example:
npm run load-dishes a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

The script will:
1. Verify the group exists
2. Show a summary of dishes to load (from `data/processed/*.json`)
3. Wait for confirmation (press Enter)
4. Upload images to storage and insert dishes

### Alternative: Create a Test Group Directly

For quick testing without a user, create an ownerless group:

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
INSERT INTO groups (name, description, owner_id, is_personal)
VALUES ('Test Kitchen', 'Test data group', NULL, false)
RETURNING id;
"
```

Use the returned UUID with `npm run load-dishes`.

### Data Files

Test data is loaded from:
- `data/processed/notes_from_note.json` - Dishes from notes
- `data/processed/image_analysis_results.json` - Dishes with images

### Resetting Test Data

To start fresh:

```bash
# Reset entire database (removes all data, re-runs migrations)
npm run supabase:reset

# Then reload test data
npm run load-dishes <group_id>
```

## Troubleshooting

### Port Conflicts

If Supabase fails to start with port errors:

```bash
# Stop all Supabase instances
npm run supabase:stop

# Or stop all projects across machine
npx supabase stop --all

# Then restart
npm run supabase:start
```

### Docker Issues

```bash
# Check Docker is running
docker ps

# View Supabase container logs
docker logs supabase_db_bb-kitchen-v1 --tail 50

# Restart Docker Desktop if containers are unresponsive
```

### Database Connection Issues

```bash
# Check services are running
npm run supabase:status

# Test database connection
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "SELECT 1"
```

### Reset Everything

```bash
# Nuclear option - removes all data
npm run supabase:stop
npx supabase stop --all
npm run supabase:start
npm run supabase:reset
```

### TypeScript Types Out of Sync

```bash
# Regenerate types from current local database schema
npm run supabase:generate-types
```

## Configuration Files

### supabase/config.toml

Main configuration for the local Supabase instance:
- Port mappings
- Auth providers (Google OAuth)
- Storage buckets
- Database settings

### supabase/seed.sql

Seed data loaded after migrations during `supabase:reset`.

## Production vs Local Differences

| Aspect | Local | Production |
|--------|-------|------------|
| URL | http://127.0.0.1:54321 | https://xxx.supabase.co |
| Auth keys | Default demo keys | Project-specific keys |
| Email | Mailpit (local inbox) | Real email delivery |
| Storage | Local Docker volume | Supabase cloud storage |
| Data | Ephemeral (Docker volumes) | Persistent |

## Best Practices

1. **Always use `dev:local` or `test:local`** - Ensures correct environment
2. **Reset before important test runs** - `npm run supabase:reset`
3. **Commit migrations** - Track schema changes in git
4. **Test migrations locally first** - Before applying to production
5. **Use Supabase Studio** - For quick data inspection and debugging

## Related Documentation

- [SETUP.md](./SETUP.md) - Production Supabase setup
- [TESTING.md](./TESTING.md) - Playwright testing guide
- [Supabase Local Development](https://supabase.com/docs/guides/local-development) - Official docs

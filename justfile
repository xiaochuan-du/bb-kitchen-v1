# List available commands
default:
    @just --list

# --- Development ---

# Start local Supabase and Next.js dev server
dev:
    npm run supabase:start
    npm run dev:local

# Start Next.js dev server with local environment
dev-app:
    npm run dev:local

# --- Supabase Management ---

# Start local Supabase services
up:
    npm run supabase:start

# Stop local Supabase services
down:
    npm run supabase:stop

# Show status of local Supabase services
status:
    npm run supabase:status

# Reset local database (wipes data, re-runs migrations and seeds)
reset:
    npm run supabase:reset

# Apply pending migrations
migrate:
    npm run supabase:migrate

# Generate a new migration from schema changes (usage: just diff <migration_name>)
diff name:
    npm run supabase:diff -- -n {{name}}

# Regenerate TypeScript types from local database
types:
    npm run supabase:generate-types

# --- Testing ---

# Run all tests against local environment
test:
    npm run test:local

# Run E2E group workflow test
test-e2e:
    cp .env.local.docker .env.local && npx playwright test tests/e2e/group-workflow.spec.ts

# Run E2E group workflow test in UI mode
test-e2e-ui:
    cp .env.local.docker .env.local && npx playwright test tests/e2e/group-workflow.spec.ts --ui

# --- Data ---

# Load sample dishes into a group (usage: just load-dishes <group_id>)
load-dishes group_id:
    npm run load-dishes {{group_id}}

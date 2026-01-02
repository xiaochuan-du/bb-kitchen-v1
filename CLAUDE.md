# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TableMate is a Next.js 16 application for creating curated menu experiences with allergy transparency and democratic dessert voting. Hosts manage dish libraries and events, while guests respond via magic link invitations (no account required).

### Key Features

- **Group-Based Authorization**: Users belong to groups; all group members can view/edit dishes and events in their groups
- **Dish Library**: Progressive loading (10 at a time), category filters, soft delete, back-to-top button
- **Event Management**: Create events with appetizers, mains, desserts; invite guests via magic links
- **Guest RSVP**: Guests select main courses and vote on desserts without creating accounts
- **Order Tracking**: View who ordered what with expandable guest details
- **Post-Event Feedback**: Survey system for guests to rate dishes (thumbs up/down) with comments
- **Feedback Dashboard**: Table view showing dish ratings across all guests with comment previews

## Development Commands

```bash
# Development
npm run dev              # Start dev server at http://localhost:3000
npm run build            # Production build
npm start                # Start production server
npm run lint             # Run ESLint

# Testing
npm test                 # Run Playwright tests (headless)
npm run test:ui          # Interactive test UI
npm run test:headed      # Run tests with visible browser
npm run test:debug       # Debug mode with Playwright Inspector
npx playwright test tests/landing-page.spec.ts  # Run specific test file
npx playwright show-report  # View test results

# Data Management
npm run load-dishes <group_id>  # Load dishes from data/processed/*.json into database
```

## Local Development with Supabase (Docker)

The project includes a full local Supabase stack via Docker for development and testing with complete environment isolation.

### Prerequisites

- Docker Desktop running
- Node.js installed

### Quick Start

```bash
# 1. Start the local Supabase stack (first run downloads Docker images ~1GB)
npm run supabase:start

# 2. Run Next.js dev server with local Supabase
npm run dev:local

# 3. Access local services:
#    - App: http://localhost:3000
#    - Supabase Studio: http://127.0.0.1:54323
#    - API: http://127.0.0.1:54321
#    - Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres
#    - Mailpit (email testing): http://127.0.0.1:54324
```

### Supabase Commands

```bash
npm run supabase:start    # Start local Supabase Docker containers
npm run supabase:stop     # Stop containers (preserves data in Docker volumes)
npm run supabase:status   # Check status and get connection URLs/keys
npm run supabase:reset    # Reset database, re-run migrations, re-seed
npm run supabase:migrate  # Run pending migrations
npm run supabase:diff     # Generate migration from schema changes
npm run supabase:generate-types  # Regenerate TypeScript types from local DB
```

### Local Testing with Environment Isolation

```bash
# Run Playwright tests against local Supabase
npm run test:local
```

This copies `.env.local.docker` to `.env.local` before running tests, ensuring tests use the local Docker stack instead of production.

### Environment Files

- `.env.local.docker` - Local development environment (127.0.0.1 URLs, default local keys)
- `.env.local` - Active environment file (copied from docker or production config)

### Database Migrations

Migrations are in `supabase/migrations/` with timestamp prefixes:
- `20240101000000_initial_schema.sql` - All base tables, RLS, triggers, storage bucket
- `20240101000001_add_groups.sql` - Group-based authorization

To apply migrations after changes:
```bash
npm run supabase:reset  # Drops and recreates DB, runs all migrations + seed
```

### Troubleshooting

**Port conflicts**: If Supabase fails to start due to port conflicts:
```bash
npm run supabase:stop    # Stop all Supabase containers
# Or stop all projects across machine:
npx supabase stop --all
```

**Reset everything**:
```bash
npm run supabase:stop
npm run supabase:start
npm run supabase:reset
```

## Architecture

### Authentication Flow

- **Hosts**: Google OAuth via Supabase Auth
  - Sign in at landing page → OAuth callback → redirected to `/host`
  - Server-side session management with cookie-based auth

- **Guests**: Magic token authentication (no account required)
  - Access via URL with `?token=xxxxx` parameter
  - Token validated in Server Actions using service role key
  - Pattern: `app/guest/actions.ts` validates token before mutations

### Supabase Client Pattern

Two separate client configurations:

1. **Server Components** (`lib/supabase/server.ts`):
   - Uses `createServerClient` with cookie handling
   - Async `createClient()` function (requires `await`)
   - Respects RLS policies based on authenticated user

2. **Client Components** (`lib/supabase/client.ts`):
   - Uses `createBrowserClient` for interactive features
   - Synchronous initialization
   - Used in forms, real-time updates, image uploads

3. **Server Actions** (`app/guest/actions.ts`):
   - Uses service role key directly for magic token validation
   - Bypasses RLS to verify guest tokens
   - Pattern: Verify token → Perform operation → Update guest status

### Data Flow

**Guest Selection Submission:**
1. Guest component calls Server Action with magic token
2. Action verifies token matches guest + event
3. Upsert to `selections` table (main course)
4. Upsert to `dessert_votes` table (dessert)
5. Update `guests.has_responded = true`

**Guest Feedback Submission:**
1. Host sends feedback survey link to guest after event
2. Guest opens `/guest/{eventId}/feedback?token={magic_token}`
3. Guest rates dishes (thumbs up/down) with optional comments
4. Guest can add overall event comment
5. Upsert to `dish_feedback` and `event_feedback` tables
6. Update `guests.has_submitted_feedback = true`

**Host Event Management:**
1. Host creates dishes in library (with images in Supabase Storage)
2. Creates event with arrays of dish IDs: `appetizer_ids`, `main_dish_ids`, `dessert_ids`
3. Adds guests with emails → auto-generated `magic_token`
4. Event page fetches dishes by ID arrays to display menu
5. After event, host can view feedback in the Feedback Table

### Database Schema Key Points

- **Group-based ownership**: Dishes and events belong to groups via `group_id`, not individual hosts
- **Groups table**: Each group has an owner, name, description, and `is_personal` flag
- **Group members**: Junction table with `user_id`, `group_id`, and `role` (owner/admin/member)
- **Auto-created personal groups**: New users get a personal group on signup via trigger
- All dish/event IDs are UUIDs stored in PostgreSQL array columns
- Magic tokens: 32-byte random hex strings (auto-generated by DB)
- RLS policies: Group members access dishes/events via group membership check
- Image storage: `dish-images` bucket with public read, authenticated write
- Dish fields:
  - `description`: Guest-facing dish description (optional)
  - `recipe`: Host-only cooking instructions/notes (optional, never shown to guests)
- Guest tracking:
  - `has_responded`: Guest submitted menu selections
  - `has_submitted_feedback`: Guest submitted post-event feedback
- Feedback tables:
  - `dish_feedback`: Per-dish ratings (up/down) with optional comments
  - `event_feedback`: Overall event comments from guests

### Type Safety

- `types/database.ts` defines complete schema as TypeScript types
- Generated types include `Row`, `Insert`, `Update` for each table
- Supabase clients are typed: `createClient<Database>()`
- Ensures compile-time checking of queries and mutations

### App Router Structure

```
app/
├── page.tsx                        # Landing page (public)
├── layout.tsx                      # Root layout with auth context
├── api/auth/callback/route.ts      # OAuth callback handler
├── host/
│   ├── page.tsx                    # Dashboard with dish library (protected, group-filtered)
│   ├── events/
│   │   ├── new/page.tsx            # Event creation form (group context)
│   │   └── [eventId]/page.tsx      # Event details, guest invitations, feedback
│   └── settings/
│       └── groups/
│           ├── page.tsx            # Group management (list, create)
│           └── [groupId]/page.tsx  # Group details (members, delete)
└── guest/
    ├── actions.ts                  # Server Actions for guest mutations
    └── [eventId]/
        ├── page.tsx                # Guest RSVP flow (magic token auth)
        └── feedback/page.tsx       # Post-event feedback survey
```

**URL-based group context**: Dashboard uses `?group=xxx` parameter to switch between groups.

### Component Organization

- `components/host/`: Host-only features
  - `DishLibrary.tsx`: Dish list with progressive loading (10 at a time), category filters
  - `DishForm.tsx`, `DishCard.tsx`: Dish creation and display
  - `EventForm.tsx`, `EventDetails.tsx`: Event management
  - `GuestInvitations.tsx`: Guest list with order details and feedback email links
  - `OrderSummary.tsx`: Aggregated order counts and shopping list
  - `FeedbackTable.tsx`: Dish x guest feedback matrix with ratings and comments
  - `FeedbackEmailContent.tsx`: Thank-you email template with survey link
  - `GroupSelector.tsx`: Dropdown to switch between groups in nav
  - `GroupMemberList.tsx`: Manage group members (add, remove, change roles)
  - `CreateGroupForm.tsx`: Form to create new groups
  - `DeleteGroupButton.tsx`: Delete non-personal groups
- `components/guest/`: Guest-facing UI
  - `GuestMenuGallery.tsx`: Menu selection interface
  - `GuestFeedbackForm.tsx`: Post-event feedback form with dish ratings
- `components/AuthButton.tsx`: Shared sign-in/sign-out component
- `lib/supabase/groups.ts`: Group context helpers (getUserGroups, validateGroupAccess, getActiveGroup)

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (server-side only)
- `NEXT_PUBLIC_APP_URL`: Application URL

## Testing

12 Playwright tests covering:
- Landing page UI and content
- Authentication flows and redirects
- Accessibility (headings, semantic HTML, keyboard navigation)
- Responsive design (mobile, tablet, desktop viewports)

Tests use Page Object Model pattern when appropriate. Dev server auto-starts before tests via `webServer` config.

## Database Setup

### Local Development (Recommended)

Use the local Supabase Docker stack - see "Local Development with Supabase (Docker)" section above.

```bash
npm run supabase:start   # Start local stack
npm run supabase:reset   # Apply all migrations
```

### Production/Cloud Setup

Supabase migrations are in `supabase/migrations/`:
- `20240101000000_initial_schema.sql` - All base tables, RLS policies, triggers, storage bucket
- `20240101000001_add_groups.sql` - Group-based authorization (groups, group_members, updated RLS)

Legacy migrations in `migrations/` folder are kept for reference but not used by Supabase CLI.

Key setup steps:
1. Create all tables with RLS enabled
2. Set up trigger for profile creation on auth signup
3. Create storage bucket `dish-images` with policies
4. Configure Google OAuth in Supabase dashboard

## Common Patterns

**Fetching dishes for an event:**
```typescript
const { data: dishes } = await supabase
  .from('dishes')
  .select('*')
  .in('id', event.main_dish_ids)  // PostgreSQL array query
```

**Image uploads:**
- Client uploads to Supabase Storage bucket `dish-images`
- Returns public URL
- URL saved in `dishes.image_url` column

**Guest invite links:**
```typescript
const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/guest/${eventId}?token=${guest.magic_token}`
```

**Guest feedback survey links:**
```typescript
const feedbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/guest/${eventId}/feedback?token=${guest.magic_token}`
```

**Progressive loading pattern (DishLibrary):**
```typescript
const ITEMS_PER_PAGE = 10
const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE)
const visibleItems = filteredItems.slice(0, visibleCount)
const hasMore = visibleCount < filteredItems.length
// Load more: setVisibleCount(prev => prev + ITEMS_PER_PAGE)
```

## Security Considerations

- All tables use Row Level Security (RLS)
- **Group-based access**: Dishes/events accessible only to group members via RLS
- **Group roles**: Owners and admins can manage members; members can add/edit/delete dishes and events
- **Personal groups**: Auto-created for each user, cannot be deleted
- Email allowlist still controls who can be a host (application-level check)
- Guests cannot manipulate other guests' data (verified in Server Actions)
- Service role key only used in Server Actions, never exposed to client
- Magic tokens are 32-byte random values (256-bit entropy)

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: Supabase Auth (Google OAuth + magic tokens)
- **Storage**: Supabase Storage
- **Testing**: Playwright

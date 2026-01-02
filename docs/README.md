# Table Mate - MVP

A modern web application for hosts to create curated menu experiences with safety-first ingredient transparency and democratic dessert voting.

https://supabase.com/dashboard/project/cepfbggmuiarcibzyhfb/sql/862187ab-7986-4caa-91ac-68595ceb8920

## Features

### For Hosts
- **Dish Library Management**: Create and manage dishes with images, descriptions, ingredients, and tags
- **Smart Menu Logic**: Configure events with fixed appetizers, customizable main courses, and democratic dessert voting
- **Guest Invitation System**: Send magic links to guests - no account required for guests
- **Order Summary**: Real-time tracking of guest selections and auto-generated shopping lists
- **Google OAuth**: Secure host authentication via Google

### For Guests
- **Visual Menu Gallery**: Browse dishes with high-quality images
- **Allergy Warning System**: Clear ingredient lists displayed prominently on every dish
- **Main Course Selection**: Choose between options or receive a fixed menu
- **Democratic Dessert Voting**: Vote for favorite dessert (winner served to all)
- **No Account Required**: Access via magic link using Google ID

## Tech Stack

- **Framework**: Next.js 16 with TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Google OAuth via Supabase Auth
- **Storage**: Supabase Storage for dish images
- **Deployment**: Optimized for Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Docker Desktop (for local development)

### Quick Start (Local Development)

The fastest way to get started is with the local Supabase Docker stack:

```bash
# 1. Install dependencies
npm install

# 2. Start local Supabase (first run downloads ~1GB Docker images)
npm run supabase:start

# 3. Run the app with local environment
npm run dev:local

# 4. Open http://localhost:3000
```

See [LOCAL-DEVELOPMENT.md](./LOCAL-DEVELOPMENT.md) for full local development documentation.

### Cloud Setup (Production)

For cloud Supabase setup:

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Set up a Google Cloud Console project for OAuth
3. Follow [SETUP.md](./SETUP.md) for detailed instructions

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
bb-kitchen-v1/
├── app/                      # Next.js app directory
│   ├── api/auth/callback/    # OAuth callback
│   ├── guest/[eventId]/      # Guest RSVP pages
│   ├── host/                 # Host dashboard
│   └── page.tsx              # Landing page
├── components/               # React components
│   ├── guest/                # Guest-facing components
│   └── host/                 # Host dashboard components
├── lib/supabase/             # Supabase client configurations
├── types/database.ts         # Database schema types
├── proxy.ts                  # Authentication middleware
└── SETUP.md                  # Detailed setup instructions
```

## Database Schema

The application uses 6 main tables:
- `profiles` - User profiles (synced with auth.users)
- `dishes` - Dish library with ingredients
- `events` - Event configurations
- `guests` - Guest invitations with magic tokens
- `selections` - Main course selections
- `dessert_votes` - Dessert voting results

See [SETUP.md](./SETUP.md) for complete schema and SQL setup.

## Development

```bash
# Local Supabase (Docker)
npm run supabase:start     # Start local Supabase stack
npm run supabase:stop      # Stop containers
npm run supabase:reset     # Reset DB and run migrations
npm run supabase:status    # Show service URLs

# Development server
npm run dev                # Run with production Supabase
npm run dev:local          # Run with local Supabase (recommended)

# Build
npm run build              # Build for production
npm start                  # Start production server
npm run lint               # Run linter

# Testing
npm test                   # Run Playwright tests
npm run test:local         # Run tests against local Supabase
npm run test:ui            # Run tests in UI mode

# Data management
npm run load-dishes <group_id>           # Load dishes from JSON files
npm run supabase:generate-types          # Regenerate TypeScript types
```

## Deployment

Deploy to Vercel with these commands:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod
```

After deployment, add environment variables in Vercel Dashboard and configure Supabase redirect URLs. See [SETUP.md](./SETUP.md#5-deploy-to-production-vercel) for detailed instructions.

## Testing

This project includes comprehensive end-to-end testing with Playwright:
- **12 automated tests** covering landing page, authentication, accessibility, and responsive design
- **CI/CD ready** with automatic test retry and HTML reports
- **Local environment isolation** via Docker-based Supabase

```bash
# Run tests against local Supabase (recommended)
npm run test:local

# Run tests with UI
npm run test:ui
```

For detailed testing documentation, see [TESTING.md](./TESTING.md) and [LOCAL-DEVELOPMENT.md](./LOCAL-DEVELOPMENT.md)

## Success Criteria (MVP)

✅ Host can set up an event in under 5 minutes
✅ Guests can complete food selection without asking clarifying questions
✅ Host has a clear shopping list 48 hours before the event
✅ All ingredients clearly displayed for allergy safety
✅ Democratic dessert voting with clear expectations

## Security Features

- Row Level Security (RLS) enabled on all tables
- Magic token authentication for guests
- Google OAuth for host authentication
- Image upload validation and storage policies
- Server-side session management

## License

MIT

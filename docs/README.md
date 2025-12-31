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
- A Supabase account ([supabase.com](https://supabase.com))
- A Google Cloud Console project for OAuth

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up your database following [SETUP.md](./SETUP.md)

4. Configure environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials (from Supabase Dashboard and Google Cloud Console)

5. Run the development server:
```bash
npm run dev
```

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
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Run tests
npm test

# Run tests in UI mode
npm run test:ui

# Load dishes from JSON files
npm run load-dishes <host_id>
```

## Testing

This project includes comprehensive end-to-end testing with Playwright:
- **12 automated tests** covering landing page, authentication, accessibility, and responsive design
- **CI/CD ready** with automatic test retry and HTML reports
- **MCP integration** for automated testing in Claude Code

For detailed testing documentation, see [TESTING.md](./TESTING.md)

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

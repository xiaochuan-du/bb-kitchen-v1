# Table Mate - MVP

A modern web application for hosts to create curated menu experiences with safety-first ingredient transparency and democratic dessert voting.

[View Project Dashboard](https://supabase.com/dashboard/project/cepfbggmuiarcibzyhfb)
[vercel project](https://vercel.com/xiaochuan-dus-projects/bb-kitchen-v1)

## Features

### For Hosts
- **Dish Library Management**: Create and manage dishes with images, descriptions, ingredients, and tags.
- **Smart Menu Logic**: Configure events with fixed appetizers, customizable main courses, and democratic dessert voting.
- **Guest Invitation System**: Send magic links to guests - no account required for guests.
- **Order Summary**: Real-time tracking of guest selections and auto-generated shopping lists.
- **Google OAuth**: Secure host authentication via Google.

### For Guests
- **Visual Menu Gallery**: Browse dishes with high-quality images.
- **Allergy Warning System**: Clear ingredient lists displayed prominently on every dish.
- **Main Course Selection**: Choose between options or receive a fixed menu.
- **Democratic Dessert Voting**: Vote for favorite dessert (winner served to all).
- **No Account Required**: Access via magic link using Google ID.

## How It Works

### For the Host
1. **Sign in** → Redirected to Host Dashboard.
2. **Add Dishes** → Click "+ Add Dish", fill in name, category, ingredients, upload image.
3. **Create Event** → Click "+ New Event", select dishes for each course, set menu logic.
4. **Invite Guests** → Enter emails, copy magic links, send via email/text.
5. **Monitor Responses** → See real-time selections and get auto-generated shopping list.

### For Guests
1. **Open Magic Link** → No sign-up needed.
2. **View Menu** → See beautiful images and ingredient warnings.
3. **Make Selections** → Choose main course (if applicable) and vote for dessert.
4. **Submit** → Done! Confirmation shown.

## Quick Start (Local Development)

The fastest way to get started is with the local Supabase Docker stack.

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start local Supabase** (first run downloads ~1GB Docker images):
   ```bash
   npm run supabase:start
   ```

3. **Run the app**:
   ```bash
   npm run dev:local
   ```

4. **Open** [http://localhost:3000](http://localhost:3000)

## Documentation

- **[LOCAL-DEVELOPMENT.md](./LOCAL-DEVELOPMENT.md)**: Detailed guide for the local Supabase/Docker environment.
- **[SETUP.md](./SETUP.md)**: Production deployment and cloud Supabase configuration.
- **[TESTING.md](./TESTING.md)**: Guide for running and writing Playwright tests.
- `supabase/migrations` migration scripts

## Tech Stack

- **Framework**: Next.js 16 with TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Google OAuth via Supabase Auth
- **Storage**: Supabase Storage for dish images
- **Deployment**: Optimized for Vercel

## Development Commands

```bash
# Local Supabase
npm run supabase:start     # Start local stack
npm run supabase:stop      # Stop (preserves data)
npm run supabase:reset     # Wipe DB and re-seed

# App
npm run dev:local          # Run app with local Supabase
npm run test:local         # Run tests against local Supabase
```

## License

MIT
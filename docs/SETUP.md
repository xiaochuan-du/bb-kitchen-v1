# Production Setup Guide

This guide covers setting up TableMate for production using Supabase Cloud and Vercel.

> **Note:** For local development, please refer to [LOCAL-DEVELOPMENT.md](./LOCAL-DEVELOPMENT.md).

## 1. Supabase Cloud Setup

1. Create a new project at [supabase.com](https://supabase.com).
2. Note your `Project URL` and `API Keys` (Anon Public & Service Role) from **Project Settings > API**.

### Database Migrations

Instead of manually running SQL, use the provided migration files in the `migrations/` folder.

You can copy-paste the contents of the files in `migrations/` into the Supabase SQL Editor in numerical order:
1. `migrations/01_initial_schema.sql`
2. `migrations/02_add_recipe_to_dishes.sql`
...and so on.

## 2. Google OAuth Configuration

### In Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com).
2. Create a new project (or select an existing one).
3. Navigate to **APIs & Services > OAuth consent screen** and configure it (External or Internal).
4. Go to **Credentials > Create Credentials > OAuth client ID**.
5. Application type: **Web application**.
6. **Authorized JavaScript origins**:
   - `https://your-app.vercel.app` (Production URL)
   - `http://localhost:3000` (Local dev)
7. **Authorized redirect URIs**:
   - `https://[YOUR_SUPABASE_PROJECT_ID].supabase.co/auth/v1/callback`
   - `http://localhost:3000/api/auth/callback` (Local dev)
8. Copy the **Client ID** and **Client Secret**.

### In Supabase Dashboard
1. Go to **Authentication > Providers**.
2. Enable **Google**.
3. Paste the **Client ID** and **Client Secret** from Google Cloud.
4. Save.

## 3. Environment Variables

Create a `.env.local` file for local testing with your production keys (optional, but careful not to commit):

```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR_SERVICE_ROLE_KEY]

GOOGLE_CLIENT_ID=[YOUR_GOOGLE_CLIENT_ID]
GOOGLE_CLIENT_SECRET=[YOUR_GOOGLE_CLIENT_SECRET]

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 4. Deploy to Vercel

### Initial Deployment

```bash
npm install -g vercel
vercel
```

Follow the prompts to link your project.

### Configure Environment Variables

Add the following variables in Vercel (**Settings > Environment Variables**):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (keep secret) |
| `NEXT_PUBLIC_APP_URL` | Your Vercel production URL (e.g., https://your-app.vercel.app) |

### Final Production Config

Once deployed to Vercel:

1. **Supabase Dashboard**:
   - Go to **Authentication > URL Configuration**.
   - Set **Site URL** to your Vercel URL (e.g., `https://your-app.vercel.app`).
   - Add `https://your-app.vercel.app/**` to **Redirect URLs**.

2. **Google Cloud Console**:
   - Ensure `https://your-app.vercel.app` is in **Authorized JavaScript origins**.

## 5. Verification

1. Open your production URL.
2. Sign in with Google.
3. Verify you can create a dish and an event.
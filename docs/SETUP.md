# TableMate - Setup Instructions

> **Tip:** For local development, use the Docker-based Supabase stack instead. See [LOCAL-DEVELOPMENT.md](./LOCAL-DEVELOPMENT.md) for the recommended development workflow.

## 1. Supabase Database Setup (Cloud)

### Create a new Supabase project at https://supabase.com

### Database Migrations

The database schema is available in the `migrations/` folder with numbered migration files:
- `01_initial_schema.sql` - Initial database schema (tables, RLS policies, triggers, storage)
- `02_add_recipe_to_dishes.sql` - Add recipe field to dishes table

You can run these migrations in order in the Supabase SQL Editor, or use a migration tool like Supabase CLI.

### Run the following SQL in the Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (synced with auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  is_host BOOLEAN DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Dishes table
CREATE TABLE dishes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  recipe TEXT,
  ingredients TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  category TEXT NOT NULL CHECK (category IN ('appetizer', 'main', 'dessert'))
);

ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can view their own dishes" ON dishes
  FOR SELECT USING (auth.uid() = host_id);

CREATE POLICY "Hosts can insert their own dishes" ON dishes
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their own dishes" ON dishes
  FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their own dishes" ON dishes
  FOR DELETE USING (auth.uid() = host_id);

-- Events table
CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  host_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  appetizer_ids UUID[] DEFAULT '{}',
  main_dish_ids UUID[] DEFAULT '{}',
  dessert_ids UUID[] DEFAULT '{}',
  main_selection_type TEXT DEFAULT 'choose_one' CHECK (main_selection_type IN ('choose_one', 'fixed'))
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can view their own events" ON events
  FOR SELECT USING (auth.uid() = host_id);

CREATE POLICY "Hosts can insert their own events" ON events
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their own events" ON events
  FOR UPDATE USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their own events" ON events
  FOR DELETE USING (auth.uid() = host_id);

-- Guests table
CREATE TABLE guests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  google_id TEXT,
  has_responded BOOLEAN DEFAULT false,
  magic_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  UNIQUE(event_id, email)
);

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view guests by magic token" ON guests
  FOR SELECT USING (true);

CREATE POLICY "Event hosts can manage guests" ON guests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = guests.event_id
      AND events.host_id = auth.uid()
    )
  );

-- Selections table
CREATE TABLE selections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  selected_main_id UUID REFERENCES dishes(id),
  UNIQUE(guest_id, event_id)
);

ALTER TABLE selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view selections" ON selections
  FOR SELECT USING (true);

CREATE POLICY "Guests can insert their own selections" ON selections
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Guests can update their own selections" ON selections
  FOR UPDATE USING (true);

-- Dessert votes table
CREATE TABLE dessert_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  dessert_id UUID REFERENCES dishes(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(guest_id, event_id)
);

ALTER TABLE dessert_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view dessert votes" ON dessert_votes
  FOR SELECT USING (true);

CREATE POLICY "Guests can insert their own votes" ON dessert_votes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Guests can update their own votes" ON dessert_votes
  FOR UPDATE USING (true);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for dish images
INSERT INTO storage.buckets (id, name, public) VALUES ('dish-images', 'dish-images', true);

-- Storage policies
CREATE POLICY "Anyone can view dish images" ON storage.objects
  FOR SELECT USING (bucket_id = 'dish-images');

CREATE POLICY "Authenticated users can upload dish images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'dish-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own dish images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'dish-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their own dish images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'dish-images'
    AND auth.role() = 'authenticated'
  );
```

## 2. Configure Google OAuth

### In Supabase Dashboard:
1. Go to Authentication > Providers
2. Enable Google provider
3. Add your Google Client ID and Secret

### In Google Cloud Console (https://console.cloud.google.com):
1. Create a new project or select existing
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs:
   - `https://[YOUR_PROJECT_ID].supabase.co/auth/v1/callback`
   - `http://localhost:3000/api/auth/callback` (for local development)
5. Copy Client ID and Secret to Supabase

## 3. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
# From Supabase Dashboard > Settings > API
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# From Google Cloud Console
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Your app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 4. Install and Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 5. Deploy to Production (Vercel)

### Install Vercel CLI

```bash
npm install -g vercel
```

### Initial Deployment

```bash
vercel
```

This will:
1. Prompt you to log in (opens browser)
2. Ask to link to an existing project or create new
3. Deploy to a preview URL

### Add Environment Variables

Add the required environment variables to Vercel:

```bash
# Add each variable (you'll be prompted to enter the value)
echo "YOUR_SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "YOUR_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "YOUR_SERVICE_ROLE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY production
echo "https://your-app.vercel.app" | vercel env add NEXT_PUBLIC_APP_URL production
```

Or add them via the Vercel Dashboard: **Settings → Environment Variables**

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (keep secret) |
| `NEXT_PUBLIC_APP_URL` | Your Vercel production URL |

### Deploy to Production

```bash
vercel --prod
```

### Configure Supabase for Production

After deployment, update your Supabase settings:

1. **Authentication → URL Configuration**
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: Add `https://your-app.vercel.app/**`

2. **Google Cloud Console**
   - Add `https://your-app.vercel.app` to Authorized JavaScript origins
   - Ensure `https://[YOUR_PROJECT_ID].supabase.co/auth/v1/callback` is in Authorized redirect URIs

### Subsequent Deployments

For future deployments, simply run:

```bash
vercel --prod
```

Or enable GitHub integration in the Vercel dashboard for automatic deployments on push to `main`.

## 6. First-Time Setup

1. Sign in with Google
2. Your profile will be automatically created
3. You'll be redirected to the host dashboard
4. Start by creating your first dish in the Dish Library

## Key Features Implemented

- Google OAuth authentication (no password required)
- Host Dashboard with dish library management
- Event creation with smart menu logic
- Guest invitation system with magic links
- Visual guest RSVP experience
- Ingredient transparency with allergy warnings
- Democratic dessert voting
- Shopping list and order summary
- Mobile-responsive design

## Security Notes

- All tables use Row Level Security (RLS)
- Guests access events via magic tokens (no account required)
- Hosts can only manage their own dishes and events
- Images are stored in Supabase Storage with proper access controls

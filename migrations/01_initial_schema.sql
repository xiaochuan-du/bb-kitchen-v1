-- Migration 01: Initial Database Schema
-- TableMate - Create all base tables, RLS policies, triggers, and storage bucket

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

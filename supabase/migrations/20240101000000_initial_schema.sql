-- Migration 01: Initial Database Schema
-- TableMate - Create all base tables, RLS policies, triggers

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
  name TEXT NOT NULL,
  description TEXT,
  ingredients TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  category TEXT NOT NULL CHECK (category IN ('appetizer', 'main', 'dessert')),
  recipe TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  group_id UUID NOT NULL
);

ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;

-- Create index for efficient filtering of active dishes
CREATE INDEX idx_dishes_deleted_at ON dishes(deleted_at) WHERE deleted_at IS NULL;

-- Events table
CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  appetizer_ids UUID[] DEFAULT '{}',
  main_dish_ids UUID[] DEFAULT '{}',
  dessert_ids UUID[] DEFAULT '{}',
  main_selection_type TEXT DEFAULT 'choose_one' CHECK (main_selection_type IN ('choose_one', 'fixed')),
  group_id UUID NOT NULL
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Guests table
CREATE TABLE guests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  google_id TEXT,
  has_responded BOOLEAN DEFAULT false,
  has_submitted_feedback BOOLEAN DEFAULT false,
  magic_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  UNIQUE(event_id, email)
);

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view guests by magic token" ON guests
  FOR SELECT USING (true);

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

-- Dish feedback table (thumbs up/down + optional comment per dish)
CREATE TABLE dish_feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  dish_id UUID REFERENCES dishes(id) ON DELETE CASCADE NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('up', 'down')),
  comment TEXT,
  UNIQUE(guest_id, dish_id)
);

ALTER TABLE dish_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view dish feedback" ON dish_feedback
  FOR SELECT USING (true);

CREATE POLICY "Guests can insert their own dish feedback" ON dish_feedback
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Guests can update their own dish feedback" ON dish_feedback
  FOR UPDATE USING (true);

-- Event feedback table (overall event comment)
CREATE TABLE event_feedback (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  comment TEXT,
  UNIQUE(guest_id, event_id)
);

ALTER TABLE event_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event feedback" ON event_feedback
  FOR SELECT USING (true);

CREATE POLICY "Guests can insert their own event feedback" ON event_feedback
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Guests can update their own event feedback" ON event_feedback
  FOR UPDATE USING (true);

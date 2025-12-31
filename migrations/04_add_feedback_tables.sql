-- Migration 04: Add Feedback Tables
-- TableMate - Guest feedback for dishes and events

-- Add feedback submitted flag to guests table
ALTER TABLE guests ADD COLUMN IF NOT EXISTS has_submitted_feedback BOOLEAN DEFAULT false;

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

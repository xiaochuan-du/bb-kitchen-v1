-- Migration: Grant table permissions to authenticated and anon roles
-- RLS policies control row-level access, but roles need base table permissions first

-- Groups table
GRANT SELECT, INSERT, UPDATE, DELETE ON groups TO authenticated;
GRANT SELECT ON groups TO anon;

-- Group members table
GRANT SELECT, INSERT, UPDATE, DELETE ON group_members TO authenticated;
GRANT SELECT ON group_members TO anon;

-- Profiles table (if not already granted)
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

-- Dishes table
GRANT SELECT, INSERT, UPDATE, DELETE ON dishes TO authenticated;
GRANT SELECT ON dishes TO anon;

-- Events table
GRANT SELECT, INSERT, UPDATE, DELETE ON events TO authenticated;
GRANT SELECT ON events TO anon;

-- Guests table
GRANT SELECT, INSERT, UPDATE, DELETE ON guests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON guests TO anon;

-- Selections table
GRANT SELECT, INSERT, UPDATE, DELETE ON selections TO authenticated;
GRANT SELECT, INSERT, UPDATE ON selections TO anon;

-- Dessert votes table
GRANT SELECT, INSERT, UPDATE, DELETE ON dessert_votes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON dessert_votes TO anon;

-- Dish feedback table
GRANT SELECT, INSERT, UPDATE, DELETE ON dish_feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE ON dish_feedback TO anon;

-- Event feedback table
GRANT SELECT, INSERT, UPDATE, DELETE ON event_feedback TO authenticated;
GRANT SELECT, INSERT, UPDATE ON event_feedback TO anon;

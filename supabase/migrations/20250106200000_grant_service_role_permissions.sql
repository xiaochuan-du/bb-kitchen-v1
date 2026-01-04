-- Migration: Grant table permissions to service_role
-- The service_role is used by server-side scripts (like load-dishes.ts)
-- and needs explicit table permissions in production Supabase

-- Groups table
GRANT SELECT, INSERT, UPDATE, DELETE ON groups TO service_role;

-- Group members table
GRANT SELECT, INSERT, UPDATE, DELETE ON group_members TO service_role;

-- Profiles table
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO service_role;

-- Dishes table
GRANT SELECT, INSERT, UPDATE, DELETE ON dishes TO service_role;

-- Events table
GRANT SELECT, INSERT, UPDATE, DELETE ON events TO service_role;

-- Guests table
GRANT SELECT, INSERT, UPDATE, DELETE ON guests TO service_role;

-- Selections table
GRANT SELECT, INSERT, UPDATE, DELETE ON selections TO service_role;

-- Dessert votes table
GRANT SELECT, INSERT, UPDATE, DELETE ON dessert_votes TO service_role;

-- Dish feedback table
GRANT SELECT, INSERT, UPDATE, DELETE ON dish_feedback TO service_role;

-- Event feedback table
GRANT SELECT, INSERT, UPDATE, DELETE ON event_feedback TO service_role;

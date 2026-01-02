-- Seed data for local development
-- This creates a test user and some sample data for development

-- Note: In local development, you can create users via:
-- 1. Supabase Studio UI at http://localhost:54323
-- 2. Using the Auth API
-- 3. Via Google OAuth (if configured)

-- The handle_new_user trigger will automatically create:
-- - A profile for the user
-- - A personal group ("User's Kitchen")
-- - Add the user as owner of their personal group

-- Sample categories for dishes
-- You can add more seed data here for testing

-- Example: Create a test user programmatically (for automated testing)
-- Note: This requires using the service role key in your test setup
-- The auth.users table is managed by Supabase Auth

SELECT 'Seed file loaded. Use Supabase Studio or OAuth to create test users.' as status;

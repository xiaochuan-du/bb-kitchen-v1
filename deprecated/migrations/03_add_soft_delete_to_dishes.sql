-- Migration 03: Add soft delete to dishes table
-- Instead of hard deleting dishes, we set deleted_at timestamp
-- This preserves historical data for past events and guest selections

-- Add deleted_at column (null means active, timestamp means soft-deleted)
ALTER TABLE dishes
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for efficient filtering of active dishes
CREATE INDEX idx_dishes_deleted_at ON dishes(deleted_at) WHERE deleted_at IS NULL;

-- Update RLS policy for SELECT to still allow viewing deleted dishes
-- (needed for historical event data)
-- No change needed - existing policy allows hosts to see all their dishes

-- Note: Application queries for dish library should filter WHERE deleted_at IS NULL
-- Event detail pages should NOT filter, allowing historical dishes to display

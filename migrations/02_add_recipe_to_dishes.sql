-- Add recipe column to dishes table
-- This field is for host-only cooking instructions/notes
-- Guests will not see this field

ALTER TABLE dishes ADD COLUMN recipe TEXT;

COMMENT ON COLUMN dishes.recipe IS 'Host-only cooking instructions and notes. Not visible to guests.';

-- Migration: Backfill personal groups for existing users
-- Run this to create personal groups for users who signed up before the group system

DO $$
DECLARE
  profile_record RECORD;
  new_group_id UUID;
  users_migrated INTEGER := 0;
BEGIN
  FOR profile_record IN
    SELECT p.id, p.email, p.name
    FROM profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM group_members gm WHERE gm.user_id = p.id
    )
  LOOP
    -- Create personal group for user
    INSERT INTO groups (name, description, owner_id, is_personal)
    VALUES (
      COALESCE(profile_record.name, split_part(profile_record.email, '@', 1)) || '''s Kitchen',
      'Personal dish and event library',
      profile_record.id,
      true
    )
    RETURNING id INTO new_group_id;

    -- Add owner as member with 'owner' role
    INSERT INTO group_members (group_id, user_id, role)
    VALUES (new_group_id, profile_record.id, 'owner');

    users_migrated := users_migrated + 1;
  END LOOP;

  RAISE NOTICE 'Created personal groups for % users', users_migrated;
END $$;

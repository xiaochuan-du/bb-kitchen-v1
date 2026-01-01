-- Migration 06 Recovery Script
-- Use this if the original migration partially failed
-- This script handles the case where host_id was already dropped

-- ============================================
-- STEP 1: Check current state and create groups table if needed
-- ============================================
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  is_personal BOOLEAN DEFAULT false NOT NULL
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Create group_members junction table if needed
-- ============================================
CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')) NOT NULL,
  UNIQUE(group_id, user_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Add group_id column to dishes if it doesn't exist
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dishes' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE dishes ADD COLUMN group_id UUID REFERENCES groups(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- STEP 4: Add group_id column to events if it doesn't exist
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE events ADD COLUMN group_id UUID REFERENCES groups(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- STEP 5: Create personal groups for all users who don't have one
-- ============================================
DO $$
DECLARE
  profile_record RECORD;
  new_group_id UUID;
BEGIN
  FOR profile_record IN
    SELECT p.id, p.email, p.name
    FROM profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM groups g
      WHERE g.owner_id = p.id AND g.is_personal = true
    )
  LOOP
    -- Create personal group for each user without one
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
    VALUES (new_group_id, profile_record.id, 'owner')
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END LOOP;
END $$;

-- ============================================
-- STEP 6: Assign orphaned dishes to their creator's personal group
-- (For dishes where group_id is NULL, try to find owner from other data)
-- ============================================
DO $$
DECLARE
  dish_record RECORD;
  owner_group_id UUID;
BEGIN
  -- For each dish without a group_id, assign to the first personal group we find
  -- (Since host_id is gone, we can only assign to a default group)
  FOR dish_record IN
    SELECT d.id FROM dishes d WHERE d.group_id IS NULL
  LOOP
    -- Get the first personal group (if multiple users exist, just pick one)
    SELECT g.id INTO owner_group_id
    FROM groups g
    WHERE g.is_personal = true
    LIMIT 1;

    IF owner_group_id IS NOT NULL THEN
      UPDATE dishes SET group_id = owner_group_id WHERE id = dish_record.id;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- STEP 7: Assign orphaned events to a personal group
-- ============================================
DO $$
DECLARE
  event_record RECORD;
  owner_group_id UUID;
BEGIN
  FOR event_record IN
    SELECT e.id FROM events e WHERE e.group_id IS NULL
  LOOP
    SELECT g.id INTO owner_group_id
    FROM groups g
    WHERE g.is_personal = true
    LIMIT 1;

    IF owner_group_id IS NOT NULL THEN
      UPDATE events SET group_id = owner_group_id WHERE id = event_record.id;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- STEP 8: Make group_id NOT NULL (only if all records have values)
-- ============================================
DO $$
BEGIN
  -- Only set NOT NULL if no NULL values exist
  IF NOT EXISTS (SELECT 1 FROM dishes WHERE group_id IS NULL) THEN
    ALTER TABLE dishes ALTER COLUMN group_id SET NOT NULL;
  ELSE
    RAISE NOTICE 'Some dishes still have NULL group_id - skipping NOT NULL constraint';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM events WHERE group_id IS NULL) THEN
    ALTER TABLE events ALTER COLUMN group_id SET NOT NULL;
  ELSE
    RAISE NOTICE 'Some events still have NULL group_id - skipping NOT NULL constraint';
  END IF;
END $$;

-- ============================================
-- STEP 9: Drop host_id columns if they still exist
-- ============================================
ALTER TABLE dishes DROP COLUMN IF EXISTS host_id;
ALTER TABLE events DROP COLUMN IF EXISTS host_id;

-- ============================================
-- STEP 10: Update handle_new_user() trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_group_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'avatar_url'
  );

  -- Create personal group for the new user
  INSERT INTO public.groups (name, description, owner_id, is_personal)
  VALUES (
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)) || '''s Kitchen',
    'Personal dish and event library',
    new.id,
    true
  )
  RETURNING id INTO new_group_id;

  -- Add user as owner of their personal group
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (new_group_id, new.id, 'owner');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 11: RLS Policies for groups table
-- ============================================
DROP POLICY IF EXISTS "Users can view groups they belong to" ON groups;
CREATE POLICY "Users can view groups they belong to" ON groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create groups" ON groups;
CREATE POLICY "Authenticated users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Group owners can update their groups" ON groups;
CREATE POLICY "Group owners can update their groups" ON groups
  FOR UPDATE USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Group owners can delete non-personal groups" ON groups;
CREATE POLICY "Group owners can delete non-personal groups" ON groups
  FOR DELETE USING (owner_id = auth.uid() AND is_personal = false);

-- ============================================
-- STEP 12: RLS Policies for group_members table
-- ============================================
DROP POLICY IF EXISTS "Users can view members of groups they belong to" ON group_members;
CREATE POLICY "Users can view members of groups they belong to" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group owners and admins can add members" ON group_members;
CREATE POLICY "Group owners and admins can add members" ON group_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
    )
    OR (
      EXISTS (
        SELECT 1 FROM groups g
        WHERE g.id = group_members.group_id
        AND g.owner_id = auth.uid()
      )
      AND group_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group owners and admins can update members" ON group_members;
CREATE POLICY "Group owners and admins can update members" ON group_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Group owners and admins can remove members" ON group_members;
CREATE POLICY "Group owners and admins can remove members" ON group_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
    )
    AND group_members.role != 'owner'
  );

-- ============================================
-- STEP 13: RLS Policies for dishes (group-based)
-- ============================================
DROP POLICY IF EXISTS "Users can view dishes in their groups" ON dishes;
CREATE POLICY "Users can view dishes in their groups" ON dishes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = dishes.group_id
      AND group_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert dishes in their groups" ON dishes;
CREATE POLICY "Users can insert dishes in their groups" ON dishes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = dishes.group_id
      AND group_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update dishes in their groups" ON dishes;
CREATE POLICY "Users can update dishes in their groups" ON dishes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = dishes.group_id
      AND group_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete dishes in their groups" ON dishes;
CREATE POLICY "Users can delete dishes in their groups" ON dishes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = dishes.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- ============================================
-- STEP 14: RLS Policies for events (group-based)
-- ============================================
DROP POLICY IF EXISTS "Users can view events in their groups" ON events;
CREATE POLICY "Users can view events in their groups" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = events.group_id
      AND group_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert events in their groups" ON events;
CREATE POLICY "Users can insert events in their groups" ON events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = events.group_id
      AND group_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update events in their groups" ON events;
CREATE POLICY "Users can update events in their groups" ON events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = events.group_id
      AND group_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete events in their groups" ON events;
CREATE POLICY "Users can delete events in their groups" ON events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = events.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- ============================================
-- STEP 15: RLS Policy for guests (group-based)
-- ============================================
DROP POLICY IF EXISTS "Group members can manage guests for their events" ON guests;
CREATE POLICY "Group members can manage guests for their events" ON guests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN group_members gm ON gm.group_id = e.group_id
      WHERE e.id = guests.event_id
      AND gm.user_id = auth.uid()
    )
  );

-- ============================================
-- STEP 16: Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_dishes_group_id ON dishes(group_id);
CREATE INDEX IF NOT EXISTS idx_events_group_id ON events(group_id);

-- ============================================
-- STEP 17: Helper function
-- ============================================
CREATE OR REPLACE FUNCTION get_user_groups(user_uuid UUID)
RETURNS TABLE (
  group_id UUID,
  group_name TEXT,
  group_description TEXT,
  is_personal BOOLEAN,
  role TEXT,
  owner_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT g.id, g.name, g.description, g.is_personal, gm.role, g.owner_id
  FROM groups g
  JOIN group_members gm ON g.id = gm.group_id
  WHERE gm.user_id = user_uuid
  ORDER BY g.is_personal DESC, g.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Done!
SELECT 'Migration recovery complete!' as status;

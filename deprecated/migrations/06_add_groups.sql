-- Migration 06: Add Groups and Group Membership
-- Implements group-based authorization for dishes and events
-- Users in the same group can view/edit all dishes and events in that group

-- ============================================
-- STEP 1: Create groups table
-- ============================================
CREATE TABLE groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  is_personal BOOLEAN DEFAULT false NOT NULL
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Create group_members junction table
-- ============================================
CREATE TABLE group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')) NOT NULL,
  UNIQUE(group_id, user_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Drop old RLS policies that depend on host_id (MUST happen before dropping columns)
-- ============================================

-- Drop old dishes policies
DROP POLICY IF EXISTS "Hosts can view all dishes" ON dishes;
DROP POLICY IF EXISTS "Hosts can view their own dishes" ON dishes;
DROP POLICY IF EXISTS "Hosts can insert their own dishes" ON dishes;
DROP POLICY IF EXISTS "Hosts can update their own dishes" ON dishes;
DROP POLICY IF EXISTS "Hosts can delete their own dishes" ON dishes;

-- Drop old events policies
DROP POLICY IF EXISTS "Hosts can view their own events" ON events;
DROP POLICY IF EXISTS "Hosts can insert their own events" ON events;
DROP POLICY IF EXISTS "Hosts can update their own events" ON events;
DROP POLICY IF EXISTS "Hosts can delete their own events" ON events;

-- Drop old guests policy that references events.host_id
DROP POLICY IF EXISTS "Event hosts can manage guests" ON guests;

-- ============================================
-- STEP 4: Add group_id to dishes and events (nullable initially)
-- ============================================
ALTER TABLE dishes ADD COLUMN group_id UUID REFERENCES groups(id) ON DELETE CASCADE;
ALTER TABLE events ADD COLUMN group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

-- ============================================
-- STEP 5: Migrate existing data - create personal groups and assign dishes/events
-- ============================================
DO $$
DECLARE
  profile_record RECORD;
  new_group_id UUID;
BEGIN
  FOR profile_record IN SELECT id, email, name FROM profiles LOOP
    -- Create personal group for each existing user
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

    -- Migrate all dishes belonging to this user to their personal group
    UPDATE dishes SET group_id = new_group_id WHERE host_id = profile_record.id;

    -- Migrate all events belonging to this user to their personal group
    UPDATE events SET group_id = new_group_id WHERE host_id = profile_record.id;
  END LOOP;
END $$;

-- ============================================
-- STEP 6: Make group_id NOT NULL after migration
-- ============================================
ALTER TABLE dishes ALTER COLUMN group_id SET NOT NULL;
ALTER TABLE events ALTER COLUMN group_id SET NOT NULL;

-- ============================================
-- STEP 7: Drop old host_id columns
-- ============================================
ALTER TABLE dishes DROP COLUMN host_id;
ALTER TABLE events DROP COLUMN host_id;

-- ============================================
-- STEP 8: Update handle_new_user() trigger to create personal group
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
-- STEP 9: RLS Policies for groups table
-- ============================================

-- Users can view groups they belong to
CREATE POLICY "Users can view groups they belong to" ON groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );

-- Authenticated users can create groups (as owner)
CREATE POLICY "Authenticated users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Group owners can update their groups
CREATE POLICY "Group owners can update their groups" ON groups
  FOR UPDATE USING (owner_id = auth.uid());

-- Group owners can delete non-personal groups
CREATE POLICY "Group owners can delete non-personal groups" ON groups
  FOR DELETE USING (owner_id = auth.uid() AND is_personal = false);

-- ============================================
-- STEP 10: RLS Policies for group_members table
-- ============================================

-- Users can view members of groups they belong to
CREATE POLICY "Users can view members of groups they belong to" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
    )
  );

-- Group owners/admins can add members
CREATE POLICY "Group owners and admins can add members" ON group_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
    )
    -- Also allow initial owner insertion (when creating a group)
    OR (
      EXISTS (
        SELECT 1 FROM groups g
        WHERE g.id = group_members.group_id
        AND g.owner_id = auth.uid()
      )
      AND group_members.user_id = auth.uid()
    )
  );

-- Group owners/admins can update member roles
CREATE POLICY "Group owners and admins can update members" ON group_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role IN ('owner', 'admin')
    )
  );

-- Group owners/admins can remove members (but not the owner)
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
-- STEP 11: Create new dishes RLS policies for group-based access
-- ============================================

-- Users can view dishes in groups they belong to
CREATE POLICY "Users can view dishes in their groups" ON dishes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = dishes.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Users can create dishes in groups they belong to
CREATE POLICY "Users can insert dishes in their groups" ON dishes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = dishes.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Users can update dishes in groups they belong to
CREATE POLICY "Users can update dishes in their groups" ON dishes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = dishes.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Users can delete dishes in groups they belong to
CREATE POLICY "Users can delete dishes in their groups" ON dishes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = dishes.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- ============================================
-- STEP 12: Create new events RLS policies for group-based access
-- ============================================

-- Users can view events in groups they belong to
CREATE POLICY "Users can view events in their groups" ON events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = events.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Users can create events in groups they belong to
CREATE POLICY "Users can insert events in their groups" ON events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = events.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Users can update events in groups they belong to
CREATE POLICY "Users can update events in their groups" ON events
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = events.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Users can delete events in groups they belong to
CREATE POLICY "Users can delete events in their groups" ON events
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = events.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- ============================================
-- STEP 13: Create new guests RLS policy based on group membership
-- ============================================

-- Create new policy based on group membership (old policy was dropped in Step 3)
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
-- STEP 14: Create index for performance
-- ============================================
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_dishes_group_id ON dishes(group_id);
CREATE INDEX idx_events_group_id ON events(group_id);

-- ============================================
-- STEP 15: Helper function to get user's groups (optional, for convenience)
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

-- Migration 02: Add Groups and Group Membership
-- Implements group-based authorization for dishes and events

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
-- STEP 3: Add foreign keys to dishes and events
-- ============================================
ALTER TABLE dishes ADD CONSTRAINT dishes_group_id_fkey FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;
ALTER TABLE events ADD CONSTRAINT events_group_id_fkey FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

-- ============================================
-- STEP 4: Create helper functions (avoid RLS recursion)
-- ============================================
CREATE OR REPLACE FUNCTION auth_user_is_group_member(check_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = check_group_id
    AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION auth_user_is_group_admin(check_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = check_group_id
    AND user_id = auth.uid()
    AND role IN ('owner', 'admin')
  );
$$;

-- ============================================
-- STEP 5: RLS Policies for groups table
-- ============================================
CREATE POLICY "Users can view groups they belong to" ON groups
  FOR SELECT USING (auth_user_is_group_member(id));

CREATE POLICY "Authenticated users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Group owners can update their groups" ON groups
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Group owners can delete non-personal groups" ON groups
  FOR DELETE USING (owner_id = auth.uid() AND is_personal = false);

-- ============================================
-- STEP 6: RLS Policies for group_members table
-- ============================================
CREATE POLICY "Users can view members of groups they belong to" ON group_members
  FOR SELECT USING (auth_user_is_group_member(group_id));

CREATE POLICY "Group owners and admins can add members" ON group_members
  FOR INSERT WITH CHECK (
    auth_user_is_group_admin(group_id)
    OR (
      EXISTS (
        SELECT 1 FROM groups g
        WHERE g.id = group_members.group_id
        AND g.owner_id = auth.uid()
      )
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group owners and admins can update members" ON group_members
  FOR UPDATE USING (auth_user_is_group_admin(group_id));

CREATE POLICY "Group owners and admins can remove members" ON group_members
  FOR DELETE USING (
    auth_user_is_group_admin(group_id)
    AND group_members.role != 'owner'
  );

-- ============================================
-- STEP 7: RLS Policies for dishes (group-based)
-- ============================================
CREATE POLICY "Users can view dishes in their groups" ON dishes
  FOR SELECT USING (auth_user_is_group_member(group_id));

CREATE POLICY "Users can insert dishes in their groups" ON dishes
  FOR INSERT WITH CHECK (auth_user_is_group_member(group_id));

CREATE POLICY "Users can update dishes in their groups" ON dishes
  FOR UPDATE USING (auth_user_is_group_member(group_id));

CREATE POLICY "Users can delete dishes in their groups" ON dishes
  FOR DELETE USING (auth_user_is_group_member(group_id));

-- ============================================
-- STEP 8: RLS Policies for events (group-based)
-- ============================================
CREATE POLICY "Users can view events in their groups" ON events
  FOR SELECT USING (auth_user_is_group_member(group_id));

CREATE POLICY "Users can insert events in their groups" ON events
  FOR INSERT WITH CHECK (auth_user_is_group_member(group_id));

CREATE POLICY "Users can update events in their groups" ON events
  FOR UPDATE USING (auth_user_is_group_member(group_id));

CREATE POLICY "Users can delete events in their groups" ON events
  FOR DELETE USING (auth_user_is_group_member(group_id));

-- ============================================
-- STEP 9: RLS Policy for guests (group-based)
-- ============================================
CREATE POLICY "Group members can manage guests for their events" ON guests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = guests.event_id
      AND auth_user_is_group_member(e.group_id)
    )
  );

-- ============================================
-- STEP 10: Allow authenticated users to look up profiles (for adding group members)
-- ============================================
CREATE POLICY "Authenticated users can view profiles" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================
-- STEP 11: Create indexes for performance
-- ============================================
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_dishes_group_id ON dishes(group_id);
CREATE INDEX idx_events_group_id ON events(group_id);

-- ============================================
-- STEP 12: Helper function to get user's groups
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

-- ============================================
-- STEP 13: Trigger to create personal group on user signup
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

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

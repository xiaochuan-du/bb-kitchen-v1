-- Migration 07: Fix RLS Recursion in group_members
-- The original policy caused infinite recursion by checking group_members to access group_members

-- ============================================
-- STEP 1: Create helper function to check membership (bypasses RLS)
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

-- ============================================
-- STEP 2: Fix group_members SELECT policy
-- ============================================
DROP POLICY IF EXISTS "Users can view members of groups they belong to" ON group_members;

-- Users can see members of groups they belong to (using helper function to avoid recursion)
CREATE POLICY "Users can view members of groups they belong to" ON group_members
  FOR SELECT USING (
    auth_user_is_group_member(group_id)
  );

-- ============================================
-- STEP 3: Fix group_members INSERT policy (also had recursion)
-- ============================================
DROP POLICY IF EXISTS "Group owners and admins can add members" ON group_members;

-- Create helper function for checking admin/owner role
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

CREATE POLICY "Group owners and admins can add members" ON group_members
  FOR INSERT WITH CHECK (
    -- Existing admins/owners can add members
    auth_user_is_group_admin(group_id)
    -- OR: User adding themselves to a group they own (initial setup)
    OR (
      EXISTS (
        SELECT 1 FROM groups g
        WHERE g.id = group_members.group_id
        AND g.owner_id = auth.uid()
      )
      AND group_members.user_id = auth.uid()
    )
  );

-- ============================================
-- STEP 4: Fix group_members UPDATE policy
-- ============================================
DROP POLICY IF EXISTS "Group owners and admins can update members" ON group_members;

CREATE POLICY "Group owners and admins can update members" ON group_members
  FOR UPDATE USING (
    auth_user_is_group_admin(group_id)
  );

-- ============================================
-- STEP 5: Fix group_members DELETE policy
-- ============================================
DROP POLICY IF EXISTS "Group owners and admins can remove members" ON group_members;

CREATE POLICY "Group owners and admins can remove members" ON group_members
  FOR DELETE USING (
    auth_user_is_group_admin(group_id)
    AND group_members.role != 'owner'
  );

-- ============================================
-- STEP 6: Fix groups SELECT policy (also had potential recursion)
-- ============================================
DROP POLICY IF EXISTS "Users can view groups they belong to" ON groups;

CREATE POLICY "Users can view groups they belong to" ON groups
  FOR SELECT USING (
    auth_user_is_group_member(id)
  );

-- ============================================
-- STEP 7: Fix dishes SELECT policy
-- ============================================
DROP POLICY IF EXISTS "Users can view dishes in their groups" ON dishes;

CREATE POLICY "Users can view dishes in their groups" ON dishes
  FOR SELECT USING (
    auth_user_is_group_member(group_id)
  );

-- ============================================
-- STEP 8: Fix dishes INSERT policy
-- ============================================
DROP POLICY IF EXISTS "Users can insert dishes in their groups" ON dishes;

CREATE POLICY "Users can insert dishes in their groups" ON dishes
  FOR INSERT WITH CHECK (
    auth_user_is_group_member(group_id)
  );

-- ============================================
-- STEP 9: Fix dishes UPDATE policy
-- ============================================
DROP POLICY IF EXISTS "Users can update dishes in their groups" ON dishes;

CREATE POLICY "Users can update dishes in their groups" ON dishes
  FOR UPDATE USING (
    auth_user_is_group_member(group_id)
  );

-- ============================================
-- STEP 10: Fix dishes DELETE policy
-- ============================================
DROP POLICY IF EXISTS "Users can delete dishes in their groups" ON dishes;

CREATE POLICY "Users can delete dishes in their groups" ON dishes
  FOR DELETE USING (
    auth_user_is_group_member(group_id)
  );

-- ============================================
-- STEP 11: Fix events SELECT policy
-- ============================================
DROP POLICY IF EXISTS "Users can view events in their groups" ON events;

CREATE POLICY "Users can view events in their groups" ON events
  FOR SELECT USING (
    auth_user_is_group_member(group_id)
  );

-- ============================================
-- STEP 12: Fix events INSERT policy
-- ============================================
DROP POLICY IF EXISTS "Users can insert events in their groups" ON events;

CREATE POLICY "Users can insert events in their groups" ON events
  FOR INSERT WITH CHECK (
    auth_user_is_group_member(group_id)
  );

-- ============================================
-- STEP 13: Fix events UPDATE policy
-- ============================================
DROP POLICY IF EXISTS "Users can update events in their groups" ON events;

CREATE POLICY "Users can update events in their groups" ON events
  FOR UPDATE USING (
    auth_user_is_group_member(group_id)
  );

-- ============================================
-- STEP 14: Fix events DELETE policy
-- ============================================
DROP POLICY IF EXISTS "Users can delete events in their groups" ON events;

CREATE POLICY "Users can delete events in their groups" ON events
  FOR DELETE USING (
    auth_user_is_group_member(group_id)
  );

-- ============================================
-- STEP 15: Fix guests policy
-- ============================================
DROP POLICY IF EXISTS "Group members can manage guests for their events" ON guests;

CREATE POLICY "Group members can manage guests for their events" ON guests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = guests.event_id
      AND auth_user_is_group_member(e.group_id)
    )
  );

-- Done!
SELECT 'RLS recursion fix complete!' as status;

-- Fix: Circular RLS dependencies in group creation flow
--
-- Problem 1: groups SELECT policy requires membership, but user isn't a member yet
--            after creating a group (the .select() chain fails)
-- Problem 2: group_members INSERT policy tries to SELECT from groups table,
--            but groups RLS blocks that because user isn't a member yet

-- Create a SECURITY DEFINER function to check group ownership (bypasses RLS)
CREATE OR REPLACE FUNCTION auth_user_is_group_owner(check_group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM groups
    WHERE id = check_group_id
    AND owner_id = auth.uid()
  );
$$;

-- Fix 1: Update groups SELECT policy to allow owners to view their groups
-- (even before they're added as members)
DROP POLICY IF EXISTS "Users can view groups they belong to" ON groups;

CREATE POLICY "Users can view groups they belong to or own" ON groups
  FOR SELECT USING (
    auth_user_is_group_member(id)
    OR owner_id = auth.uid()
  );

-- Fix 2: Update group_members INSERT policy to use the new function
DROP POLICY IF EXISTS "Group owners and admins can add members" ON group_members;

CREATE POLICY "Group owners and admins can add members" ON group_members
  FOR INSERT WITH CHECK (
    auth_user_is_group_admin(group_id)
    OR (
      auth_user_is_group_owner(group_id)
      AND group_members.user_id = auth.uid()
    )
  );

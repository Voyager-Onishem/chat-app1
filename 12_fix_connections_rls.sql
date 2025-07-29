-- 12_fix_connections_rls.sql
-- Fix RLS policies for connections table

-- Drop existing connections policies
DROP POLICY IF EXISTS "Users can create connections" ON connections;
DROP POLICY IF EXISTS "Users can view their connections" ON connections;
DROP POLICY IF EXISTS "Users can update their connections" ON connections;
DROP POLICY IF EXISTS "Users can delete their connections" ON connections;
DROP POLICY IF EXISTS "Admins can manage all connections" ON connections;

-- Recreate connections policies with better error handling
-- Users can create connection requests (as requester)
CREATE POLICY "Users can create connections"
  ON connections
  FOR INSERT
  WITH CHECK (
    requester_id = auth.uid() 
    AND addressee_id != auth.uid()  -- Can't connect to yourself
    AND EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid())  -- Must have a profile
  );

-- Users can view connections they're involved in
CREATE POLICY "Users can view their connections"
  ON connections
  FOR SELECT
  USING (
    requester_id = auth.uid() 
    OR addressee_id = auth.uid()
  );

-- Users can update connections they're involved in (for accepting/rejecting)
CREATE POLICY "Users can update their connections"
  ON connections
  FOR UPDATE
  USING (
    requester_id = auth.uid() 
    OR addressee_id = auth.uid()
  )
  WITH CHECK (
    requester_id = auth.uid() 
    OR addressee_id = auth.uid()
  );

-- Users can delete their own connection requests
CREATE POLICY "Users can delete their connections"
  ON connections
  FOR DELETE
  USING (
    requester_id = auth.uid() 
    OR addressee_id = auth.uid()
  );

-- Admins can manage all connections
CREATE POLICY "Admins can manage all connections"
  ON connections
  FOR ALL
  USING (is_admin());

-- Ensure users can select from auth.users for foreign key validation
GRANT SELECT ON TABLE auth.users TO authenticated; 
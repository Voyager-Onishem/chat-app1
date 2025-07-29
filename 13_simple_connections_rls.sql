-- 13_simple_connections_rls.sql
-- Simplified RLS policies for connections table

-- Drop all existing connections policies
DROP POLICY IF EXISTS "Users can create connections" ON connections;
DROP POLICY IF EXISTS "Users can view their connections" ON connections;
DROP POLICY IF EXISTS "Users can update their connections" ON connections;
DROP POLICY IF EXISTS "Users can delete their connections" ON connections;
DROP POLICY IF EXISTS "Admins can manage all connections" ON connections;

-- Simple INSERT policy - just check requester_id matches auth.uid()
CREATE POLICY "Users can create connections"
  ON connections
  FOR INSERT
  WITH CHECK (requester_id = auth.uid());

-- Simple SELECT policy - users can see connections they're involved in
CREATE POLICY "Users can view their connections"
  ON connections
  FOR SELECT
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- Simple UPDATE policy - users can update connections they're involved in
CREATE POLICY "Users can update their connections"
  ON connections
  FOR UPDATE
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- Simple DELETE policy - users can delete connections they're involved in
CREATE POLICY "Users can delete their connections"
  ON connections
  FOR DELETE
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- Ensure users can select from auth.users for foreign key validation
GRANT SELECT ON TABLE auth.users TO authenticated; 
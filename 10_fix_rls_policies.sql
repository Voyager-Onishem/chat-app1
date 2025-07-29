-- 10_fix_rls_policies.sql
-- Fix RLS policies to work with existing foreign key structure
-- Tables reference auth.users(id), but we need to check roles from profiles

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins and moderators can create announcements" ON announcements;
DROP POLICY IF EXISTS "Admins and moderators can update announcements" ON announcements;
DROP POLICY IF EXISTS "Admins and moderators can delete announcements" ON announcements;
DROP POLICY IF EXISTS "Alumni and admins can post jobs" ON jobs;
DROP POLICY IF EXISTS "Admins and moderators can create events" ON events;
DROP POLICY IF EXISTS "Alumni can create guidance articles" ON guidance_articles;
DROP POLICY IF EXISTS "Admins and moderators can view all articles" ON guidance_articles;
DROP POLICY IF EXISTS "Admins and moderators can update all articles" ON guidance_articles;

-- Grant necessary permissions for role checking
GRANT SELECT ON TABLE auth.users TO authenticated;

-- Recreate policies with proper role checking
CREATE POLICY "Admins and moderators can create announcements"
  ON announcements
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins and moderators can update announcements"
  ON announcements
  FOR UPDATE
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins and moderators can delete announcements"
  ON announcements
  FOR DELETE
  USING (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Alumni and admins can post jobs"
  ON jobs
  FOR INSERT
  WITH CHECK (
    posted_by_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('alumni', 'admin', 'moderator')
    )
  );

CREATE POLICY "Admins and moderators can create events"
  ON events
  FOR INSERT
  WITH CHECK (
    created_by_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Alumni can create guidance articles"
  ON guidance_articles
  FOR INSERT
  WITH CHECK (
    author_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'alumni'
    )
  );

CREATE POLICY "Admins and moderators can view all articles"
  ON guidance_articles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins and moderators can update all articles"
  ON guidance_articles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  ); 
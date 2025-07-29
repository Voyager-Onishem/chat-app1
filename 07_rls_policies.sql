-- 07_rls_policies.sql
-- Row Level Security Policies for Alumni Networking Platform

-- Create admins table and is_admin function (if not exists)
CREATE TABLE IF NOT EXISTS admins (
  user_id uuid PRIMARY KEY
);

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE guidance_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_skills ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles"
  ON profiles
  FOR ALL
  USING (is_admin());

-- Allow users to view all profiles (for directory)
CREATE POLICY "Users can view all profiles"
  ON profiles
  FOR SELECT
  USING (true);

-- ============================================================================
-- CONNECTIONS TABLE POLICIES
-- ============================================================================

-- Users can create connection requests
CREATE POLICY "Users can create connections"
  ON connections
  FOR INSERT
  WITH CHECK (requester_id = auth.uid());

-- Users can view connections they're involved in
CREATE POLICY "Users can view their connections"
  ON connections
  FOR SELECT
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- Users can update connections they're involved in
CREATE POLICY "Users can update their connections"
  ON connections
  FOR UPDATE
  USING (requester_id = auth.uid() OR addressee_id = auth.uid())
  WITH CHECK (requester_id = auth.uid() OR addressee_id = auth.uid());

-- Users can delete their own connection requests
CREATE POLICY "Users can delete their connections"
  ON connections
  FOR DELETE
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- Admins can manage all connections
CREATE POLICY "Admins can manage all connections"
  ON connections
  FOR ALL
  USING (is_admin());

-- ============================================================================
-- CONVERSATIONS TABLE POLICIES
-- ============================================================================

-- Users can create conversations
CREATE POLICY "Users can create conversations"
  ON conversations
  FOR INSERT
  WITH CHECK (true);

-- Users can view conversations they're part of
CREATE POLICY "Users can view their conversations"
  ON conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants 
      WHERE conversation_id = conversations.id 
      AND user_id = auth.uid()
    )
  );

-- Admins can manage all conversations
CREATE POLICY "Admins can manage all conversations"
  ON conversations
  FOR ALL
  USING (is_admin());

-- ============================================================================
-- CONVERSATION_PARTICIPANTS TABLE POLICIES
-- ============================================================================

-- Users can add themselves to conversations
CREATE POLICY "Users can add themselves to conversations"
  ON conversation_participants
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can view participants of conversations they're in
CREATE POLICY "Users can view conversation participants"
  ON conversation_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp2
      WHERE cp2.conversation_id = conversation_participants.conversation_id
      AND cp2.user_id = auth.uid()
    )
  );

-- Users can remove themselves from conversations
CREATE POLICY "Users can remove themselves from conversations"
  ON conversation_participants
  FOR DELETE
  USING (user_id = auth.uid());

-- Admins can manage all conversation participants
CREATE POLICY "Admins can manage all conversation participants"
  ON conversation_participants
  FOR ALL
  USING (is_admin());

-- ============================================================================
-- MESSAGES TABLE POLICIES
-- ============================================================================

-- Users can send messages to conversations they're part of
CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- Users can view messages in conversations they're part of
CREATE POLICY "Users can view messages"
  ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- Users can update their own messages
CREATE POLICY "Users can update their messages"
  ON messages
  FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "Users can delete their messages"
  ON messages
  FOR DELETE
  USING (sender_id = auth.uid());

-- Admins can manage all messages
CREATE POLICY "Admins can manage all messages"
  ON messages
  FOR ALL
  USING (is_admin());

-- ============================================================================
-- ANNOUNCEMENTS TABLE POLICIES
-- ============================================================================

-- Admins and moderators can create announcements
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

-- Everyone can view announcements
CREATE POLICY "Everyone can view announcements"
  ON announcements
  FOR SELECT
  USING (true);

-- Admins and moderators can update announcements
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

-- Admins and moderators can delete announcements
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

-- ============================================================================
-- JOBS TABLE POLICIES
-- ============================================================================

-- Alumni, admins, and moderators can post jobs
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

-- Everyone can view jobs
CREATE POLICY "Everyone can view jobs"
  ON jobs
  FOR SELECT
  USING (true);

-- Job posters can update their own jobs
CREATE POLICY "Job posters can update their jobs"
  ON jobs
  FOR UPDATE
  USING (posted_by_user_id = auth.uid())
  WITH CHECK (posted_by_user_id = auth.uid());

-- Job posters and admins can delete jobs
CREATE POLICY "Job posters and admins can delete jobs"
  ON jobs
  FOR DELETE
  USING (
    posted_by_user_id = auth.uid() OR
    is_admin()
  );

-- ============================================================================
-- EVENTS TABLE POLICIES
-- ============================================================================

-- Admins and moderators can create events
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

-- Everyone can view events
CREATE POLICY "Everyone can view events"
  ON events
  FOR SELECT
  USING (true);

-- Event creators and admins can update events
CREATE POLICY "Event creators and admins can update events"
  ON events
  FOR UPDATE
  USING (
    created_by_user_id = auth.uid() OR
    is_admin()
  )
  WITH CHECK (
    created_by_user_id = auth.uid() OR
    is_admin()
  );

-- Event creators and admins can delete events
CREATE POLICY "Event creators and admins can delete events"
  ON events
  FOR DELETE
  USING (
    created_by_user_id = auth.uid() OR
    is_admin()
  );

-- ============================================================================
-- EVENT_RSVPS TABLE POLICIES
-- ============================================================================

-- Users can RSVP to events
CREATE POLICY "Users can RSVP to events"
  ON event_rsvps
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can view RSVPs for events they're part of
CREATE POLICY "Users can view RSVPs"
  ON event_rsvps
  FOR SELECT
  USING (true);

-- Users can update their own RSVPs
CREATE POLICY "Users can update their RSVPs"
  ON event_rsvps
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own RSVPs
CREATE POLICY "Users can delete their RSVPs"
  ON event_rsvps
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- GUIDANCE_ARTICLES TABLE POLICIES
-- ============================================================================

-- Alumni can create guidance articles
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

-- Everyone can view approved articles
CREATE POLICY "Everyone can view approved articles"
  ON guidance_articles
  FOR SELECT
  USING (status = 'approved');

-- Authors can view their own articles
CREATE POLICY "Authors can view their articles"
  ON guidance_articles
  FOR SELECT
  USING (author_user_id = auth.uid());

-- Admins and moderators can view all articles
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

-- Authors can update their own articles
CREATE POLICY "Authors can update their articles"
  ON guidance_articles
  FOR UPDATE
  USING (author_user_id = auth.uid())
  WITH CHECK (author_user_id = auth.uid());

-- Admins and moderators can update all articles
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

-- Authors and admins can delete articles
CREATE POLICY "Authors and admins can delete articles"
  ON guidance_articles
  FOR DELETE
  USING (
    author_user_id = auth.uid() OR
    is_admin()
  );

-- ============================================================================
-- TAGS TABLE POLICIES
-- ============================================================================

-- Everyone can view tags
CREATE POLICY "Everyone can view tags"
  ON tags
  FOR SELECT
  USING (true);

-- Admins can manage tags
CREATE POLICY "Admins can manage tags"
  ON tags
  FOR ALL
  USING (is_admin());

-- ============================================================================
-- ARTICLE_TAGS TABLE POLICIES
-- ============================================================================

-- Everyone can view article tags
CREATE POLICY "Everyone can view article tags"
  ON article_tags
  FOR SELECT
  USING (true);

-- Admins can manage article tags
CREATE POLICY "Admins can manage article tags"
  ON article_tags
  FOR ALL
  USING (is_admin());

-- ============================================================================
-- SKILLS TABLE POLICIES
-- ============================================================================

-- Everyone can view skills
CREATE POLICY "Everyone can view skills"
  ON skills
  FOR SELECT
  USING (true);

-- Admins can manage skills
CREATE POLICY "Admins can manage skills"
  ON skills
  FOR ALL
  USING (is_admin());

-- ============================================================================
-- PROFILE_SKILLS TABLE POLICIES
-- ============================================================================

-- Users can manage their own skills
CREATE POLICY "Users can manage their skills"
  ON profile_skills
  FOR ALL
  USING (user_id = auth.uid());

-- Everyone can view profile skills
CREATE POLICY "Everyone can view profile skills"
  ON profile_skills
  FOR SELECT
  USING (true);

-- Admins can manage all profile skills
CREATE POLICY "Admins can manage all profile skills"
  ON profile_skills
  FOR ALL
  USING (is_admin());

-- ============================================================================
-- STORAGE POLICIES FOR PROFILE PHOTOS
-- ============================================================================

-- Allow authenticated users to upload their own photos
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own photos
CREATE POLICY "Users can update their own photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to profile photos
CREATE POLICY "Public can view profile photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-photos');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete their own photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]); 
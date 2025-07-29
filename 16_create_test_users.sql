-- 16_create_test_users.sql
-- Create test users for login testing
-- Note: This script creates users directly in auth.users and profiles
-- You'll need to set passwords manually in Supabase Auth dashboard

-- First, create the pending_registrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS pending_registrations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'alumni')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'denied')) DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  review_comment TEXT
);

-- Create index for pending_registrations
CREATE INDEX IF NOT EXISTS idx_pending_registrations_user_id ON pending_registrations(user_id);

-- Insert test admin user (you'll need to create this user in Supabase Auth dashboard first)
-- Replace the UUIDs with actual user IDs from your Supabase Auth dashboard
INSERT INTO profiles (user_id, full_name, email, role, is_mentor, bio, location, company, job_title, graduation_year, skills, profile_photo_url, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@college.edu', 'admin', false, 'System Administrator', 'College Campus', 'College', 'Administrator', 2020, '[]', null, now(), now())
ON CONFLICT (user_id) DO NOTHING;

-- Insert test alumni user
INSERT INTO profiles (user_id, full_name, email, role, is_mentor, bio, location, company, job_title, graduation_year, skills, profile_photo_url, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000002', 'Alumni User', 'alumni@college.edu', 'alumni', true, 'Experienced professional', 'Tech City', 'Tech Corp', 'Senior Developer', 2018, '["JavaScript", "React", "Node.js"]', null, now(), now())
ON CONFLICT (user_id) DO NOTHING;

-- Insert test student user
INSERT INTO profiles (user_id, full_name, email, role, is_mentor, bio, location, company, job_title, graduation_year, skills, profile_photo_url, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000003', 'Student User', 'student@college.edu', 'student', false, 'Current student', 'College Campus', 'College', 'Student', 2025, '["Python", "Java"]', null, now(), now())
ON CONFLICT (user_id) DO NOTHING;

-- Insert admin record
INSERT INTO admins (user_id, created_at)
VALUES ('00000000-0000-0000-0000-000000000001', now())
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample announcements
INSERT INTO announcements (title, content, priority, posted_by, created_at, updated_at)
VALUES 
  ('Welcome to the Alumni Network', 'Welcome to our new alumni networking platform!', 'normal', '00000000-0000-0000-0000-000000000001', now(), now()),
  ('Important Update', 'Please update your profiles with current information.', 'high', '00000000-0000-0000-0000-000000000001', now(), now())
ON CONFLICT DO NOTHING;

-- Insert sample jobs
INSERT INTO jobs (title, company, description, location, salary_range, requirements, posted_by, created_at, updated_at)
VALUES 
  ('Software Developer', 'Tech Corp', 'Looking for a skilled developer', 'Tech City', '$60k-$80k', 'React, Node.js, 2+ years experience', '00000000-0000-0000-0000-000000000002', now(), now()),
  ('Marketing Intern', 'Marketing Inc', 'Great opportunity for students', 'College Town', '$15/hour', 'Marketing major, good communication skills', '00000000-0000-0000-0000-000000000002', now(), now())
ON CONFLICT DO NOTHING;

-- Insert sample events
INSERT INTO events (title, description, date, location, max_participants, created_by, created_at, updated_at)
VALUES 
  ('Alumni Meetup', 'Annual alumni networking event', '2024-12-15 18:00:00', 'College Campus', 50, '00000000-0000-0000-0000-000000000001', now(), now()),
  ('Career Fair', 'Meet potential employers', '2024-11-20 10:00:00', 'College Auditorium', 100, '00000000-0000-0000-0000-000000000001', now(), now())
ON CONFLICT DO NOTHING; 
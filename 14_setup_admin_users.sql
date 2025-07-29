-- 14_setup_admin_users.sql
-- Setup sample admin users for testing the role-based login system

-- First, let's create some sample users in auth.users (you'll need to do this manually in Supabase Auth)
-- Then we'll add them to the admins table and profiles table

-- Add admin users to the admins table
-- Replace these UUIDs with actual user IDs from your Supabase Auth
INSERT INTO admins (user_id) VALUES 
  ('00000000-0000-0000-0000-000000000001'), -- admin@college.edu
  ('00000000-0000-0000-0000-000000000002'); -- admin2@college.edu

-- Add admin profiles
INSERT INTO profiles (
  user_id,
  full_name,
  email,
  role,
  graduation_year,
  company,
  job_title,
  linkedin_url,
  bio,
  is_mentor
) VALUES 
  (
    '00000000-0000-0000-0000-000000000001',
    'Admin User',
    'admin@college.edu',
    'admin',
    2020,
    'College Administration',
    'Platform Administrator',
    'https://linkedin.com/in/admin',
    'Platform administrator with full system access.',
    false
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Admin User 2',
    'admin2@college.edu',
    'admin',
    2019,
    'College Administration',
    'System Administrator',
    'https://linkedin.com/in/admin2',
    'System administrator with full platform control.',
    false
  );

-- Add some sample alumni users
INSERT INTO profiles (
  user_id,
  full_name,
  email,
  role,
  graduation_year,
  company,
  job_title,
  linkedin_url,
  bio,
  is_mentor
) VALUES 
  (
    '00000000-0000-0000-0000-000000000003',
    'John Alumni',
    'john.alumni@college.edu',
    'alumni',
    2022,
    'Tech Corp',
    'Senior Developer',
    'https://linkedin.com/in/johnalumni',
    'Experienced software developer looking to mentor students.',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    'Sarah Graduate',
    'sarah.graduate@college.edu',
    'alumni',
    2021,
    'Marketing Inc',
    'Marketing Manager',
    'https://linkedin.com/in/sarahgraduate',
    'Marketing professional with 3 years of experience.',
    true
  );

-- Add some sample student users
INSERT INTO profiles (
  user_id,
  full_name,
  email,
  role,
  graduation_year,
  company,
  job_title,
  linkedin_url,
  bio,
  is_mentor
) VALUES 
  (
    '00000000-0000-0000-0000-000000000005',
    'Mike Student',
    'mike.student@college.edu',
    'student',
    2025,
    NULL,
    'Student',
    NULL,
    'Current student looking for mentorship and opportunities.',
    false
  ),
  (
    '00000000-0000-0000-0000-000000000006',
    'Lisa Student',
    'lisa.student@college.edu',
    'student',
    2024,
    NULL,
    'Student',
    NULL,
    'Senior student seeking job opportunities.',
    false
  );

-- Add some sample announcements
INSERT INTO announcements (title, content, priority, posted_by) VALUES 
  (
    'Welcome to the Alumni Platform',
    'Welcome to our new alumni networking platform! Connect with fellow graduates and current students.',
    'normal',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'Important: Platform Maintenance',
    'The platform will be under maintenance on Sunday from 2-4 AM. Please plan accordingly.',
    'high',
    '00000000-0000-0000-0000-000000000001'
  );

-- Add some sample jobs
INSERT INTO jobs (title, company, description, location, salary_range, requirements, posted_by) VALUES 
  (
    'Software Engineer',
    'Tech Corp',
    'We are looking for a talented software engineer to join our team.',
    'San Francisco, CA',
    '$80,000 - $120,000',
    'Bachelor\'s degree in Computer Science, 2+ years experience',
    '00000000-0000-0000-0000-000000000003'
  ),
  (
    'Marketing Intern',
    'Marketing Inc',
    'Summer internship opportunity for marketing students.',
    'New York, NY',
    '$25/hour',
    'Currently enrolled student, marketing major preferred',
    '00000000-0000-0000-0000-000000000004'
  );

-- Add some sample events
INSERT INTO events (title, description, date, location, max_participants, created_by) VALUES 
  (
    'Alumni Networking Mixer',
    'Join us for an evening of networking with fellow alumni and current students.',
    '2024-02-15 18:00:00',
    'College Campus, Main Hall',
    50,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    'Career Fair 2024',
    'Annual career fair featuring top companies and organizations.',
    '2024-03-20 10:00:00',
    'College Campus, Gymnasium',
    200,
    '00000000-0000-0000-0000-000000000001'
  ); 
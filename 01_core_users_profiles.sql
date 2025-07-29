-- 01_core_users_profiles.sql

-- Enums
CREATE TYPE user_role AS ENUM ('student', 'alumni', 'admin', 'moderator');

-- Users table is managed by Supabase Auth (auth.users)
-- Custom Profiles table for extended info
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  profile_picture_url TEXT,
  portfolio_url TEXT,
  phone_number VARCHAR(20),
  major VARCHAR(100),
  graduation_year INTEGER,
  company VARCHAR(100),
  job_title VARCHAR(100),
  linkedin_url VARCHAR(255),
  bio TEXT,
  is_mentor BOOLEAN DEFAULT FALSE,
  skills TEXT[],
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
); 
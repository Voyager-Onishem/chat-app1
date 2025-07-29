-- 03_platform_features.sql

-- Enums
CREATE TYPE rsvp_status AS ENUM ('attending', 'not_attending', 'interested');

-- Announcements
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  title VARCHAR(255) NOT NULL,
  company VARCHAR(100) NOT NULL,
  location VARCHAR(100),
  description TEXT NOT NULL,
  apply_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  event_time TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Event RSVPs
CREATE TABLE event_rsvps (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  status rsvp_status NOT NULL,
  PRIMARY KEY (user_id, event_id)
); 
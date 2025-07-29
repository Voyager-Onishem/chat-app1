-- 04_extended_features.sql

-- Enums
CREATE TYPE article_status AS ENUM ('pending_approval', 'approved', 'rejected');

-- Guidance Articles
CREATE TABLE guidance_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_user_id UUID NOT NULL REFERENCES auth.users(id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  status article_status DEFAULT 'pending_approval',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tags
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL
);

-- Article Tags
CREATE TABLE article_tags (
  article_id UUID NOT NULL REFERENCES guidance_articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
); 
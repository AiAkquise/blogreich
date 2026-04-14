/*
  # Blogreich Database Schema

  1. New Tables
    - `companies` - Company profiles with industry, style, and target audience info
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text, company name)
      - `industry` (text)
      - `description` (text)
      - `target_audience` (text)
      - `main_offerings` (text)
      - `website_urls` (text array)
      - `style_profile` (jsonb)
      - `created_at`, `updated_at` (timestamptz)

    - `blogs` - Blog posts with generation metadata and SEO info
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `company_id` (uuid, references companies)
      - `title` (text)
      - `content` (text, markdown content)
      - `status` (text: draft/generating/review/published)
      - `language` (text, default 'de')
      - `tone` (text, default 'professional')
      - `target_word_count` (int, default 3000)
      - `actual_word_count` (int)
      - `primary_keyword`, `secondary_keywords` (text/text[])
      - `seo_score` (int)
      - `content_source` (text: ai/realtime/url)
      - `source_url` (text)
      - `created_at`, `updated_at` (timestamptz)

    - `blog_images` - Images generated for blog posts
      - `id` (uuid, primary key)
      - `blog_id` (uuid, references blogs, cascade delete)
      - `user_id` (uuid, references auth.users)
      - `image_url` (text)
      - `prompt` (text)
      - `position` (text, default 'header')
      - `created_at` (timestamptz)

    - `keywords` - SEO keywords with scores and cluster assignment
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `company_id` (uuid, references companies)
      - `keyword` (text)
      - `score` (int)
      - `cluster_id` (uuid)
      - `status` (text, default 'active')
      - `created_at` (timestamptz)

    - `keyword_clusters` - Groupings of related keywords
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `company_id` (uuid, references companies)
      - `name` (text)
      - `primary_keyword` (text)
      - `target_word_count` (int, default 3500)
      - `status` (text, default 'open')
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled on all 5 tables
    - Each table has 4 policies (SELECT, INSERT, UPDATE, DELETE) restricted to authenticated users owning the row (auth.uid() = user_id)
*/

-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  name text NOT NULL,
  industry text DEFAULT '',
  description text DEFAULT '',
  target_audience text DEFAULT '',
  main_offerings text DEFAULT '',
  website_urls text[] DEFAULT '{}',
  style_profile jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own companies"
  ON companies FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own companies"
  ON companies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own companies"
  ON companies FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own companies"
  ON companies FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Blogs
CREATE TABLE IF NOT EXISTS blogs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  company_id uuid REFERENCES companies(id),
  title text NOT NULL,
  content text DEFAULT '',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'review', 'published')),
  language text DEFAULT 'de',
  tone text DEFAULT 'professional',
  target_word_count int DEFAULT 3000,
  actual_word_count int DEFAULT 0,
  primary_keyword text DEFAULT '',
  secondary_keywords text[] DEFAULT '{}',
  seo_score int DEFAULT 0,
  content_source text DEFAULT 'ai' CHECK (content_source IN ('ai', 'realtime', 'url')),
  source_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blogs"
  ON blogs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blogs"
  ON blogs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own blogs"
  ON blogs FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own blogs"
  ON blogs FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Blog Images
CREATE TABLE IF NOT EXISTS blog_images (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id uuid REFERENCES blogs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  image_url text NOT NULL,
  prompt text DEFAULT '',
  position text DEFAULT 'header',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE blog_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blog images"
  ON blog_images FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blog images"
  ON blog_images FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own blog images"
  ON blog_images FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own blog images"
  ON blog_images FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Keywords
CREATE TABLE IF NOT EXISTS keywords (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  company_id uuid REFERENCES companies(id),
  keyword text NOT NULL,
  score int DEFAULT 0,
  cluster_id uuid,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own keywords"
  ON keywords FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own keywords"
  ON keywords FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own keywords"
  ON keywords FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own keywords"
  ON keywords FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Keyword Clusters
CREATE TABLE IF NOT EXISTS keyword_clusters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  company_id uuid REFERENCES companies(id),
  name text NOT NULL,
  primary_keyword text DEFAULT '',
  target_word_count int DEFAULT 3500,
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE keyword_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own keyword clusters"
  ON keyword_clusters FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own keyword clusters"
  ON keyword_clusters FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own keyword clusters"
  ON keyword_clusters FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own keyword clusters"
  ON keyword_clusters FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

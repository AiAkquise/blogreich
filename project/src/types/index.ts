export interface Company {
  id: string;
  user_id: string;
  name: string;
  industry: string;
  description: string;
  target_audience: string;
  main_offerings: string;
  website_urls: string[];
  style_profile: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Blog {
  id: string;
  user_id: string;
  company_id: string | null;
  title: string;
  content: string;
  status: 'draft' | 'generating' | 'review' | 'published';
  language: string;
  tone: string;
  target_word_count: number;
  actual_word_count: number;
  primary_keyword: string;
  secondary_keywords: string[];
  seo_score: number;
  content_source: 'ai' | 'realtime' | 'url';
  source_url: string;
  created_at: string;
  updated_at: string;
  companies?: Company;
}

export interface BlogImage {
  id: string;
  blog_id: string;
  user_id: string;
  image_url: string;
  prompt: string;
  position: string;
  created_at: string;
}

export interface Keyword {
  id: string;
  user_id: string;
  company_id: string | null;
  keyword: string;
  score: number;
  cluster_id: string | null;
  status: string;
  created_at: string;
}

export interface KeywordCluster {
  id: string;
  user_id: string;
  company_id: string | null;
  name: string;
  primary_keyword: string;
  target_word_count: number;
  status: string;
  created_at: string;
}

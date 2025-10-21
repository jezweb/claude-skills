-- Cloudflare D1 Schema Example
-- Production-ready database schema with best practices
--
-- This file demonstrates:
-- - Proper table creation with constraints
-- - Primary and foreign keys
-- - Indexes for performance
-- - Sample data for testing
--
-- Apply with:
--   npx wrangler d1 execute my-database --local --file=schema-example.sql

-- ============================================
-- Users Table
-- ============================================

DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER,
  deleted_at INTEGER  -- Soft delete pattern
);

-- Index for email lookups (login, registration checks)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index for filtering out deleted users
CREATE INDEX IF NOT EXISTS idx_users_active ON users(user_id) WHERE deleted_at IS NULL;

-- ============================================
-- Posts Table
-- ============================================

DROP TABLE IF EXISTS posts;
CREATE TABLE IF NOT EXISTS posts (
  post_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  published INTEGER NOT NULL DEFAULT 0,  -- 0 = draft, 1 = published
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER,
  published_at INTEGER,

  -- Foreign key constraint
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Index for user's posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);

-- Index for published posts (most common query)
CREATE INDEX IF NOT EXISTS idx_posts_published_created ON posts(published, created_at DESC)
  WHERE published = 1;

-- Index for slug lookups (e.g., /blog/my-post-slug)
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);

-- ============================================
-- Comments Table
-- ============================================

DROP TABLE IF EXISTS comments;
CREATE TABLE IF NOT EXISTS comments (
  comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  parent_comment_id INTEGER,  -- For threaded comments (NULL = top-level)
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER,
  deleted_at INTEGER,

  -- Foreign keys
  FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (parent_comment_id) REFERENCES comments(comment_id) ON DELETE CASCADE
);

-- Index for post's comments
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);

-- Index for user's comments
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- Index for threaded replies
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_comment_id)
  WHERE parent_comment_id IS NOT NULL;

-- ============================================
-- Tags Table (Many-to-Many Example)
-- ============================================

DROP TABLE IF EXISTS tags;
CREATE TABLE IF NOT EXISTS tags (
  tag_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Index for tag lookups
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);

-- ============================================
-- Post Tags Junction Table
-- ============================================

DROP TABLE IF EXISTS post_tags;
CREATE TABLE IF NOT EXISTS post_tags (
  post_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),

  -- Composite primary key
  PRIMARY KEY (post_id, tag_id),

  -- Foreign keys
  FOREIGN KEY (post_id) REFERENCES posts(post_id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(tag_id) ON DELETE CASCADE
);

-- Index for finding posts by tag
CREATE INDEX IF NOT EXISTS idx_post_tags_tag_id ON post_tags(tag_id);

-- ============================================
-- Sessions Table (Example: Auth Sessions)
-- ============================================

DROP TABLE IF EXISTS sessions;
CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,  -- UUID or random token
  user_id INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER NOT NULL,
  last_activity_at INTEGER NOT NULL DEFAULT (unixepoch()),

  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Index for session cleanup (delete expired sessions)
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Index for user's sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- ============================================
-- Analytics Table (High-Write Pattern)
-- ============================================

DROP TABLE IF EXISTS page_views;
CREATE TABLE IF NOT EXISTS page_views (
  view_id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER,
  user_id INTEGER,  -- NULL for anonymous views
  ip_address TEXT,
  referrer TEXT,
  user_agent TEXT,
  viewed_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Partial index: only index recent views (last 30 days)
CREATE INDEX IF NOT EXISTS idx_page_views_recent ON page_views(post_id, viewed_at)
  WHERE viewed_at > unixepoch() - 2592000;  -- 30 days in seconds

-- ============================================
-- Optimize Database
-- ============================================

-- Run PRAGMA optimize to collect statistics for query planner
PRAGMA optimize;

-- ============================================
-- Sample Seed Data (Optional - for testing)
-- ============================================

-- Insert test users
INSERT INTO users (email, username, full_name, bio) VALUES
  ('alice@example.com', 'alice', 'Alice Johnson', 'Software engineer and blogger'),
  ('bob@example.com', 'bob', 'Bob Smith', 'Tech enthusiast'),
  ('charlie@example.com', 'charlie', 'Charlie Brown', 'Writer and photographer');

-- Insert test tags
INSERT INTO tags (name, slug) VALUES
  ('JavaScript', 'javascript'),
  ('TypeScript', 'typescript'),
  ('Cloudflare', 'cloudflare'),
  ('Web Development', 'web-development'),
  ('Tutorial', 'tutorial');

-- Insert test posts
INSERT INTO posts (user_id, title, content, slug, published, published_at) VALUES
  (1, 'Getting Started with D1', 'Learn how to use Cloudflare D1 database...', 'getting-started-with-d1', 1, unixepoch()),
  (1, 'Building APIs with Hono', 'Hono is a lightweight web framework...', 'building-apis-with-hono', 1, unixepoch() - 86400),
  (2, 'My First Draft', 'This is a draft post...', 'my-first-draft', 0, NULL);

-- Link posts to tags
INSERT INTO post_tags (post_id, tag_id) VALUES
  (1, 3),  -- Getting Started with D1 -> Cloudflare
  (1, 5),  -- Getting Started with D1 -> Tutorial
  (2, 1),  -- Building APIs with Hono -> JavaScript
  (2, 3),  -- Building APIs with Hono -> Cloudflare
  (2, 5);  -- Building APIs with Hono -> Tutorial

-- Insert test comments
INSERT INTO comments (post_id, user_id, content) VALUES
  (1, 2, 'Great tutorial! Really helpful.'),
  (1, 3, 'Thanks for sharing this!'),
  (2, 3, 'Looking forward to more content on Hono.');

-- Insert threaded reply
INSERT INTO comments (post_id, user_id, parent_comment_id, content) VALUES
  (1, 1, 1, 'Glad you found it useful!');

-- ============================================
-- Verification Queries
-- ============================================

-- Count records in each table
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'posts', COUNT(*) FROM posts
UNION ALL
SELECT 'comments', COUNT(*) FROM comments
UNION ALL
SELECT 'tags', COUNT(*) FROM tags
UNION ALL
SELECT 'post_tags', COUNT(*) FROM post_tags;

-- List all tables and indexes
SELECT
  type,
  name,
  tbl_name as table_name
FROM sqlite_master
WHERE type IN ('table', 'index')
  AND name NOT LIKE 'sqlite_%'
ORDER BY type, tbl_name, name;

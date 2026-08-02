-- Migration number: 0003 	 2026-08-02T05:35:08.042Z

ALTER TABLE posts ADD COLUMN created_at TEXT;
ALTER TABLE posts ADD COLUMN updated_at TEXT;

UPDATE posts
SET
    created_at = "date",
    updated_at = "date";

CREATE INDEX IF NOT EXISTS index_posts_created_at ON posts (created_at);
CREATE INDEX IF NOT EXISTS index_posts_updated_at ON posts (updated_at);

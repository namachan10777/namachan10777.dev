-- Migration number: 0001 	 2025-07-22T08:34:52.647Z
CREATE TABLE IF NOT EXISTS posts(
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    og_image TEXT,
    og_type TEXT
);

CREATE TABLE IF NOT EXISTS tags(
    post_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    PRIMARY KEY (post_id, tag)
);

CREATE INDEX IF NOT EXISTS tags_post_id ON tags (post_id);
CREATE INDEX IF NOT EXISTS tags_tag ON tags (tag);

-- Migration number: 0002 	 2025-09-22T13:31:02.277Z

CREATE TABLE IF NOT EXISTS comments (
    post_id TEXT NOT NULL,
    id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    PRIMARY KEY(post_id, id),
    FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS index_comments_create_at ON comments(created_at);
CREATE TABLE IF NOT EXISTS likes (
    post_id TEXT NOT NULL PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Migration number: 0001 	 2025-07-22T08:34:52.647Z
CREATE TABLE IF NOT EXISTS posts(
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    og_image TEXT,
    og_type TEXT,
    publish BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS tags(
    id TEXT NOT NULL,
    value TEXT NOT NULL,
    PRIMARY KEY (id, value),
    FOREIGN KEY (id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS hash(
    post_id TEXT PRIMARY KEY,
    hash TEXT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS images(
    post_id TEXT NOT NULL,
    object_key TEXT NOT NULL,
    PRIMARY KEY (post_id, object_key),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS tags_post_id ON tags (id);
CREATE INDEX IF NOT EXISTS tags_tag ON tags (value);
CREATE INDEX IF NOT EXISTS images_post_id ON images (post_id);

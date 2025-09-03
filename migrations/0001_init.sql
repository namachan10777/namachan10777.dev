-- Migration number: 0001 	 2025-08-23T17:06:43.806Z
CREATE TABLE IF NOT EXISTS posts(
    id TEXT NOT NULL PRIMARY KEY,
    body TEXT,
    description TEXT NOT NULL,
    publish BOOL,
    og_image TEXT,
    title TEXT NOT NULL,
    hash TEXT NOT NULL
);


CREATE TABLE IF NOT EXISTS post_tags(
    id TEXT NOT NULL,
    tags TEXT NOT NULL,
    PRIMARY KEY(id, tags),
    FOREIGN KEY(id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_images(
    id TEXT NOT NULL,
    image TEXT NOT NULL,
    PRIMARY KEY(id, image),
    FOREIGN KEY(id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Table: posts

CREATE TABLE IF NOT EXISTS posts (
    id TEXT NOT NULL,
    body TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    publish INTEGER,
    hash TEXT NOT NULL,
    og_image TEXT,
    PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS index_posts_id ON posts(id);
CREATE INDEX IF NOT EXISTS index_posts_date ON posts(date(date));
CREATE INDEX IF NOT EXISTS index_posts_publish ON posts(publish);
CREATE INDEX IF NOT EXISTS index_posts_hash ON posts(hash);
CREATE INDEX IF NOT EXISTS index_posts_body ON posts(body->>'hash');
CREATE INDEX IF NOT EXISTS index_posts_og_image ON posts(og_image->>'hash');


CREATE TABLE IF NOT EXISTS post_tags (
    post_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag)
);
CREATE INDEX IF NOT EXISTS index_post_tags_tag ON post_tags(tag);


CREATE TABLE IF NOT EXISTS post_images (
    post_id TEXT NOT NULL,
    src_id TEXT NOT NULL,
    image TEXT,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, src_id)
);
CREATE INDEX IF NOT EXISTS index_post_images_src_id ON post_images(src_id);
CREATE INDEX IF NOT EXISTS index_post_images_image ON post_images(image->>'hash');

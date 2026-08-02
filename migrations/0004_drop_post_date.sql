-- Migration number: 0004 	 2026-08-02T06:00:00.000Z

DROP INDEX index_posts_date;
ALTER TABLE posts DROP COLUMN "date";

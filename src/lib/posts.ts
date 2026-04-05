import * as v from "valibot";
import * as posts from "~/generated/posts/posts-valibot";

export const postWithTagsSchema = v.intersect([
  posts.table,
  v.object({
    tags: v.pipe(v.string(), v.parseJson(), v.array(v.string())),
  }),
]);

export type PostWithTags = v.InferOutput<typeof postWithTagsSchema>;

export const PAGE_SIZE = 16;

export function paginate(count: number, current: number, pageSize = PAGE_SIZE) {
  return {
    current,
    next: count > pageSize * current ? current + 1 : undefined,
    prev: current > 1 ? current - 1 : undefined,
  };
}

export interface PostSummary {
  id: string;
  title: string;
  description: string;
  published: Date;
  tags: string[];
}

export function toPostSummary(post: PostWithTags): PostSummary {
  return {
    id: post.id,
    title: post.title,
    description: post.description,
    published: new Date(post.date),
    tags: post.tags,
  };
}

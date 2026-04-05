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

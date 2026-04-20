import { component$ } from "@qwik.dev/core";
import { StaticGenerateHandler, routeLoader$ } from "@qwik.dev/router";
import { NotFound } from "~/components/not-found";
import { PaginatedPostList } from "~/components/paginated-post-list";
import * as v from "valibot";
import {
  postWithTagsSchema,
  PAGE_SIZE,
  paginate,
  toPostSummary,
} from "~/lib/posts";

export const usePostsPages = routeLoader$(async ({ params, status, env }) => {
  try {
    const current = parseInt(params.page, 10);
    const d1 = env.get("DB");
    const q1 = `
      SELECT posts.*, json_group_array(post_tags.tag) AS tags
      FROM posts LEFT JOIN post_tags ON posts.id = post_tags.post_id
      WHERE posts.publish
      GROUP BY posts.id
      ORDER BY posts.date DESC
      LIMIT ?
      OFFSET ?
    `;

    const results =
      d1 &&
      (await d1.batch([
        d1.prepare(q1).bind(PAGE_SIZE, PAGE_SIZE * (current - 1)),
        d1.prepare("SELECT COUNT(*) AS count FROM posts WHERE posts.publish;"),
      ]));

    const parser = v.tuple([
      v.object({
        success: v.literal(true),
        results: v.array(postWithTagsSchema),
      }),
      v.object({
        success: v.literal(true),
        results: v.tuple([v.object({ count: v.number() })]),
      }),
    ]);
    const [
      { results: contents },
      {
        results: [count],
      },
    ] = v.parse(parser, results);

    return {
      contents,
      ...paginate(count.count, current),
    };
  } catch (error) {
    console.warn(error);
    status(404);
    return undefined;
  }
});

export const onStaticGenerate: StaticGenerateHandler = async ({ env }) => {
  const d1 = env.get("DB");
  if (d1) {
    const s = v.tuple([v.object({ count: v.number() })]);
    const [count] = v.parse(
      s,
      await d1
        .prepare("SELECT COUNT(*) AS count FROM posts WHERE posts.publish;")
        .run(),
    );
    return {
      params: Array.from({
        length: count.count,
      }).map((_, index) => {
        return { page: `${index + 1}` };
      }),
    };
  } else {
    return { params: [] };
  }
};

export default component$(() => {
  const page = usePostsPages();
  if (!page.value) {
    return <NotFound />;
  }
  return (
    <PaginatedPostList
      contents={page.value.contents.map(toPostSummary)}
      prev={page.value.prev ? `/post/page/${page.value.prev}` : undefined}
      next={page.value.next ? `/post/page/${page.value.next}` : undefined}
    >
      <p>概ね本当の話と、概ね本当だと思っている話と、嘘の話を書く</p>
      <h1>Post ({page.value.current})</h1>
    </PaginatedPostList>
  );
});

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
import { getBinding } from "~/lib/cloudflare";
import { logServerError } from "~/lib/server-log";

export const usePostsPages = routeLoader$(async (event) => {
  const { params, status } = event;
  try {
    const current = parseInt(params.page, 10);
    const d1 = getBinding<D1Database>(event, "DB");
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
    logServerError("warn", "Failed to load post page", error, {
      page: params.page,
    });
    status(404);
    return undefined;
  }
});

export const onStaticGenerate: StaticGenerateHandler = async (event) => {
  const d1 = getBinding<D1Database>(event, "DB");
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
      <p>
        特記事項のない限り、全ての記事は個人的に趣味で書いたものであり、所属組織とは関係がありません
      </p>
      <h1>Post ({page.value.current})</h1>
    </PaginatedPostList>
  );
});

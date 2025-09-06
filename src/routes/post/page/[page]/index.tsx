import { component$ } from "@builder.io/qwik";
import { StaticGenerateHandler, routeLoader$ } from "@builder.io/qwik-city";
import { NotFound } from "~/components/not-found";
import { PaginatedPostList } from "~/components/paginated-post-list";
import * as v from "valibot";
import * as posts from "~/generated/posts/posts";

const recordSchema = v.intersect([
  posts.table,
  v.object({
    tags: v.pipe(v.string(), v.parseJson(), v.array(v.string())),
  }),
]);

const pageSize = 16;

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
        d1.prepare(q1).bind(pageSize, pageSize * (current - 1)),
        d1.prepare("SELECT COUNT(*) AS count FROM posts WHERE posts.publish;"),
      ]));

    const parser = v.tuple([
      v.object({
        success: v.literal(true),
        results: v.array(recordSchema),
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
      current,
      next: count.count > pageSize * current ? current + 1 : undefined,
      prev: current > 1 ? current - 1 : undefined,
    };
  } catch (error) {
    console.log(error);
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
      contents={page.value.contents.map((post) => {
        return {
          id: post.id,
          title: post.title,
          description: post.description,
          published: new Date(post.date),
          tags: post.tags,
        };
      })}
      prev={page.value.prev ? `/post/page/${page.value.prev}` : undefined}
      next={page.value.next ? `/post/page/${page.value.next}` : undefined}
    >
      <h1>Post ({page.value.current})</h1>
    </PaginatedPostList>
  );
});

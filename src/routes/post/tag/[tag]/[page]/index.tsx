import { component$ } from "@builder.io/qwik";
import { StaticGenerateHandler, routeLoader$ } from "@builder.io/qwik-city";
import { PaginatedPostList } from "~/components/paginated-post-list";
import styles from "./index.module.css";
import { NotFound } from "~/components/not-found";

import * as v from "valibot";
import * as posts from "~/generated/posts/posts-valibot";

const pageSize = 16;

const recordSchema = v.intersect([
  posts.table,
  v.object({
    tags: v.pipe(v.string(), v.parseJson(), v.array(v.string())),
  }),
]);

export const usePostsPages = routeLoader$(async ({ params, status, env }) => {
  try {
    const index = parseInt(params.page, 10);
    const d1 = env.get("DB");
    const meta_q = `
      SELECT posts.*, json_group_array(post_tags.tag) AS tags
      FROM post_tags AS tag_filter
      JOIN posts ON posts.id = tag_filter.post_id
      LEFT JOIN post_tags ON posts.id = post_tags.post_id
      WHERE tag_filter.tag = ? AND posts.publish
      GROUP BY posts.id
      ORDER BY posts.date DESC
      LIMIT ?
      OFFSET ?
    `;

    const count_q = `
      SELECT COUNT(*) AS count
      FROM post_tags
      JOIN posts ON posts.id = post_tags.post_id
      WHERE post_tags.tag = ? AND posts.publish;
    `;

    const results =
      d1 &&
      (await d1.batch([
        d1.prepare(meta_q).bind(params.tag, pageSize, pageSize * (index - 1)),
        d1.prepare(count_q).bind(params.tag),
      ]));

    const s = v.tuple([
      v.object({
        results: v.array(recordSchema),
      }),
      v.object({
        results: v.tuple([
          v.object({
            count: v.number(),
          }),
        ]),
      }),
    ]);
    const [
      { results: posts },
      {
        results: [count],
      },
    ] = v.parse(s, results);

    return {
      contents: posts,
      current: index,
      next: count.count > pageSize * index ? index + 1 : undefined,
      prev: index > 1 ? index - 1 : undefined,
      tag: params.tag,
    };
  } catch (error) {
    console.warn(error);
    status(404);
    return undefined;
  }
});

export const onStaticGenerate: StaticGenerateHandler = async ({ env }) => {
  const q = `
    SELECT COUNT(posts) AS count, tag
    FROM post_tags
    LEFT JOIN posts ON posts.id = post_tags.post_id
    WHERE posts.publish
    GROUP BY post_tags.tag;
  `;
  const d1 = env.get("DB");
  if (d1 === undefined) {
    return { params: [] };
  }

  const s = v.array(
    v.object({
      tag: v.string(),
      count: v.number(),
    }),
  );
  const counts = v.parse(s, (await d1.prepare(q).run()).results);

  return {
    params: counts.flatMap((count) => {
      return Array.from({ length: Math.ceil(count.count / pageSize) }).map(
        (_, index) => ({
          tag: count.tag,
          page: `${index + 1}`,
        }),
      );
    }),
  };
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
      prev={
        page.value.prev
          ? `/post/tag/${page.value.tag}/page/${page.value.prev}`
          : undefined
      }
      next={
        page.value.next
          ? `/post/tag/${page.value.tag}/page/${page.value.next}`
          : undefined
      }
    >
      <h1>
        Post <span class={styles.tagInHeading}>#{page.value.tag}</span> (
        {page.value.current})
      </h1>
    </PaginatedPostList>
  );
});

import { component$ } from "@builder.io/qwik";
import { StaticGenerateHandler, routeLoader$ } from "@builder.io/qwik-city";
import { PaginatedPostList } from "~/components/paginated-post-list";
import styles from "./index.module.css";
import { NotFound } from "~/components/not-found";
import z from "zod";
import {
  isCountRecord,
  isPostRecords,
  isTags,
  parsePageNumber,
} from "~/generated";

const pageSize = 16;

export const usePostsPages = routeLoader$(async ({ params, status, env }) => {
  const index = parsePageNumber(params.page);
  if (index === null) {
    status(404);
    return undefined;
  }
  const d1 = env.get("DB");
  const meta_q = `
    SELECT posts.*, json_group_array(tags.value) AS tags
    FROM tags AS tag_filter
    JOIN posts ON posts.id = tag_filter.id
    LEFT JOIN tags ON posts.id = tags.id
    WHERE tag_filter.value = ? AND posts.publish
    GROUP BY posts.id
    ORDER BY posts.date DESC
    LIMIT ?
    OFFSET ?
  `;

  const count_q = `
    SELECT COUNT(*)
    FROM tags
    JOIN posts ON posts.id = tags.id
    WHERE tags.value = ? AND posts.publish;
  `;

  const results =
    d1 &&
    (await d1.batch([
      d1.prepare(meta_q).bind(params.tag, pageSize, pageSize * (index - 1)),
      d1.prepare(count_q).bind(params.tag),
    ]));

  if (results && results[0].results.length > 0) {
    const posts = results[0].results;
    const count = results[1].results[0];
    return {
      contents: isPostRecords(posts) ? posts : [],
      current: index,
      next:
        isCountRecord(results[1].results[0]) &&
        count["COUNT(*)"] > pageSize * index
          ? index + 1
          : undefined,
      prev: index > 1 ? index - 1 : undefined,
      tag: params.tag,
    };
  } else {
    status(404);
    return undefined;
  }
});

export const onStaticGenerate: StaticGenerateHandler = async ({ env }) => {
  const q = `
    SELECT COUNT(posts) AS count, tag
    FROM tags
    LEFT JOIN posts ON posts.id = tags.id
    WHERE posts.publish
    GROUP BY tags.value;
  `;
  const d1 = env.get("DB");
  if (d1 === undefined) {
    return { params: [] };
  }

  const counts = z
    .object({ tag: z.string(), count: z.number().int().min(0) })
    .array()
    .parse((await d1.prepare(q).run()).results);

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
        const tags = JSON.parse(post.tags);
        return {
          id: post.id,
          title: post.title,
          description: post.description,
          published: new Date(post.date),
          tags: isTags(tags) ? tags : [],
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

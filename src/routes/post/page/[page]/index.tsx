import { component$ } from "@builder.io/qwik";
import { StaticGenerateHandler, routeLoader$ } from "@builder.io/qwik-city";
import { NotFound } from "~/components/not-found";
import { PaginatedPostList } from "~/components/paginated-post-list";
import {
  isCountRecord,
  parsePageNumber,
  isPostRecords,
  isTags,
} from "~/generated";

const pageSize = 16;

export const usePostsPages = routeLoader$(async ({ params, status, env }) => {
  const index = parsePageNumber(params.page);
  if (index === null) {
    status(404);
    return undefined;
  }
  const d1 = env.get("DB");
  const q1 = `
    SELECT posts.*, json_group_array(tags.value) AS tags
    FROM posts LEFT JOIN tags ON posts.id = tags.id
    WHERE posts.publish
    GROUP BY posts.id
    ORDER BY posts.date DESC
    LIMIT ?
    OFFSET ?
  `;
  console.log(
    d1 &&
      (await d1
        .prepare(q1)
        .bind(pageSize, pageSize * (index - 1))
        .run()),
  );

  const results =
    d1 &&
    (await d1.batch([
      d1.prepare(q1).bind(pageSize, pageSize * (index - 1)),
      d1.prepare("SELECT COUNT(*) AS count FROM posts WHERE posts.publish;"),
    ]));

  if (results && results[0].results.length > 0) {
    const count = results[1].results[0];
    const contents = results[0].results;
    return {
      contents: isPostRecords(contents) ? contents : [],
      current: index,
      next:
        isCountRecord(count) && count.count > pageSize * index
          ? index + 1
          : undefined,
      prev: index > 1 ? index - 1 : undefined,
    };
  } else {
    status(404);
    return undefined;
  }
});

export const onStaticGenerate: StaticGenerateHandler = async ({ env }) => {
  const d1 = env.get("DB");
  if (d1) {
    const count = await d1
      .prepare("SELECT COUNT(*) AS count FROM posts WHERE posts.publish;")
      .run();
    return {
      params: Array.from({
        length: isCountRecord(count) ? count.count : 0,
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
        const tags = JSON.parse(post.tags);
        return {
          id: post.id,
          title: post.title,
          description: post.description,
          published: new Date(post.date),
          tags: isTags(tags) ? tags : [],
        };
      })}
      prev={page.value.prev ? `/post/page/${page.value.prev}` : undefined}
      next={page.value.next ? `/post/page/${page.value.next}` : undefined}
    >
      <h1>Post ({page.value.current})</h1>
    </PaginatedPostList>
  );
});

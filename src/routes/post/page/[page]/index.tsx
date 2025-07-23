import { component$ } from "@builder.io/qwik";
import { StaticGenerateHandler, routeLoader$ } from "@builder.io/qwik-city";
import { NotFound } from "~/components/not-found";
import { PaginatedPostList } from "~/components/paginated-post-list";
import { paginate } from "~/lib/contents";
import { z } from "zod";

const postSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    created_at: z.iso.date(),
    og_image: z.string().nullable(),
    og_type: z.string().nullable(),
    tags: z
      .string()
      .transform((tags) => z.string().array().parse(JSON.parse(tags))),
  })
  .array();

async function fetchAllPosts(
  db: D1Database | undefined,
): Promise<z.infer<typeof postSchema>> {
  if (db) {
    const raw = await db
      .prepare(
        `
          SELECT posts.*, json_group_array(tags.tag) AS tags
          FROM posts
          LEFT JOIN tags ON posts.id = tags.post_id
          GROUP BY posts.id
        `,
      )
      .run();
    return postSchema.parse(raw.results);
  } else {
    return [];
  }
}

export const usePostsPages = routeLoader$(async ({ params, status, env }) => {
  const index = parseInt(params.page, 10);
  const posts = await fetchAllPosts(env.get("DB"));
  const pages = paginate(posts, 16);

  if (index < 1 || index > pages.length) {
    status(404);
    return undefined;
  } else {
    const page = pages[index - 1];
    return page;
  }
});

export const onStaticGenerate: StaticGenerateHandler = async ({ env }) => {
  const posts = await fetchAllPosts(env.get("DB"));
  const pages = paginate(posts, 16);
  return {
    params: pages.map((page) => {
      return { page: page.current.toString() };
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
      contents={page.value.contents.map((post) => ({
        id: post.id,
        title: post.title,
        description: post.description,
        published: new Date(post.created_at),
        tags: post.tags,
      }))}
      prev={page.value.prev ? `/post/page/${page.value.prev}` : undefined}
      next={page.value.next ? `/post/page/${page.value.next}` : undefined}
    >
      <h1>Post ({page.value.current})</h1>
    </PaginatedPostList>
  );
});

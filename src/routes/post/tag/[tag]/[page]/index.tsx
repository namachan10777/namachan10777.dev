import type { LoaderFunctionArgs } from "react-router";
import * as v from "valibot";
import { PaginatedPostList } from "~/components/paginated-post-list";
import { getBinding } from "~/lib/cloudflare";
import {
  PAGE_SIZE,
  paginate,
  postWithTagsSchema,
  toPostSummary,
} from "~/lib/posts";
import { logServerError } from "~/lib/server-log";
import * as styles from "./index.css";

export async function loader({ params, context }: LoaderFunctionArgs) {
  try {
    const current = Number.parseInt(params.page ?? "", 10);
    const tag = params.tag;
    if (!tag || !Number.isInteger(current) || current < 1) {
      throw new Error("Invalid tag page");
    }

    const d1 = getBinding(context, "DB");
    const results = await d1.batch([
      d1
        .prepare(
          `
            SELECT posts.*, json_group_array(post_tags.tag) AS tags
            FROM post_tags AS tag_filter
            JOIN posts ON posts.id = tag_filter.post_id
            LEFT JOIN post_tags ON posts.id = post_tags.post_id
            WHERE tag_filter.tag = ? AND posts.publish
            GROUP BY posts.id
            ORDER BY posts.date DESC
            LIMIT ?
            OFFSET ?
          `,
        )
        .bind(tag, PAGE_SIZE, PAGE_SIZE * (current - 1)),
      d1
        .prepare(
          `
            SELECT COUNT(*) AS count
            FROM post_tags
            JOIN posts ON posts.id = post_tags.post_id
            WHERE post_tags.tag = ? AND posts.publish
          `,
        )
        .bind(tag),
    ]);

    const parser = v.tuple([
      v.object({ results: v.array(postWithTagsSchema) }),
      v.object({ results: v.tuple([v.object({ count: v.number() })]) }),
    ]);
    const [
      { results: contents },
      {
        results: [count],
      },
    ] = v.parse(parser, results);

    if (contents.length === 0) throw new Error("Tag page not found");
    return { contents, tag, ...paginate(count.count, current) };
  } catch (error) {
    logServerError("warn", "Failed to load tagged post page", error, {
      tag: params.tag,
      page: params.page,
    });
    throw new Response("Not Found", { status: 404 });
  }
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

export default function TaggedPostPage({
  loaderData,
}: {
  loaderData: LoaderData;
}) {
  return (
    <PaginatedPostList
      contents={loaderData.contents.map(toPostSummary)}
      prev={
        loaderData.prev
          ? `/post/tag/${loaderData.tag}/${loaderData.prev}`
          : undefined
      }
      next={
        loaderData.next
          ? `/post/tag/${loaderData.tag}/${loaderData.next}`
          : undefined
      }
    >
      <h1>
        Post <span className={styles.tagInHeading}>#{loaderData.tag}</span> (
        {loaderData.current})
      </h1>
    </PaginatedPostList>
  );
}

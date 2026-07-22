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

export async function loader({ params, context }: LoaderFunctionArgs) {
  try {
    const current = Number.parseInt(params.page ?? "", 10);
    if (!Number.isInteger(current) || current < 1)
      throw new Error("Invalid page");

    const d1 = getBinding(context, "DB");
    const results = await d1.batch([
      d1
        .prepare(
          `
            SELECT posts.*, json_group_array(post_tags.tag) AS tags
            FROM posts LEFT JOIN post_tags ON posts.id = post_tags.post_id
            WHERE posts.publish
            GROUP BY posts.id
            ORDER BY posts.date DESC
            LIMIT ?
            OFFSET ?
          `,
        )
        .bind(PAGE_SIZE, PAGE_SIZE * (current - 1)),
      d1.prepare("SELECT COUNT(*) AS count FROM posts WHERE posts.publish;"),
    ]);

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

    if (current > 1 && contents.length === 0) throw new Error("Page not found");
    return { contents, ...paginate(count.count, current) };
  } catch (error) {
    logServerError("warn", "Failed to load post page", error, {
      page: params.page,
    });
    throw new Response("Not Found", { status: 404 });
  }
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

export default function PostPage({ loaderData }: { loaderData: LoaderData }) {
  return (
    <PaginatedPostList
      contents={loaderData.contents.map(toPostSummary)}
      prev={loaderData.prev ? `/post/page/${loaderData.prev}` : undefined}
      next={loaderData.next ? `/post/page/${loaderData.next}` : undefined}
    >
      <p>
        特記事項のない限り、全ての記事は個人的に趣味で書いたものであり、所属組織とは関係がありません
      </p>
      <h1>Post ({loaderData.current})</h1>
    </PaginatedPostList>
  );
}

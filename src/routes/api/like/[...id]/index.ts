import { RequestHandler } from "@qwik.dev/router";
import { getBinding } from "~/lib/cloudflare";

export const onPost: RequestHandler = async (event) => {
  const { request, json } = event;
  try {
    const url = new URL(request.url);
    const id = url.pathname.match(/^\/api\/like\/(.+)$/)![1];
    const row = await getBinding<D1Database>(event, "DB")!
      .prepare(
        `
          INSERT INTO likes (post_id, count)
          VALUES (?, 1)
          ON CONFLICT (post_id) DO UPDATE SET
            count = count + 1
          RETURNING count;
        `,
      )
      .bind(id)
      .first();
    json(200, row);
  } catch {
    json(404, { count: 0 });
  }
};

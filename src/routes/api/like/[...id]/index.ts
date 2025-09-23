import { RequestHandler } from "@builder.io/qwik-city";

export const onPost: RequestHandler = async ({ request, env, json }) => {
  try {
    const url = new URL(request.url);
    const id = url.pathname.match(/^\/api\/like\/(.+)$/)![1];
    const row = await env
      .get("DB")!
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

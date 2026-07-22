import { data, type ActionFunctionArgs } from "react-router";
import { getBinding } from "~/lib/cloudflare";

export async function action({ params, context }: ActionFunctionArgs) {
  const id = params["*"];
  if (!id) return data({ count: 0 }, 404);

  try {
    const row = await getBinding(context, "DB")
      .prepare(
        `
          INSERT INTO likes (post_id, count)
          VALUES (?, 1)
          ON CONFLICT (post_id) DO UPDATE SET count = count + 1
          RETURNING count
        `,
      )
      .bind(id)
      .first();
    return data(row);
  } catch {
    return data({ count: 0 }, 404);
  }
}

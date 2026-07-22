import { XMLBuilder } from "fast-xml-parser";
import type { LoaderFunctionArgs } from "react-router";
import * as v from "valibot";
import { getBinding } from "~/lib/cloudflare";
import { postWithTagsSchema } from "~/lib/posts";

interface RssItem {
  title: string;
  description: string;
  link: string;
  date: Date;
  categories: string[];
}

function genRss(rss: {
  title: string;
  description: string;
  link: string;
  items: RssItem[];
  language: string;
}) {
  const builder = new XMLBuilder({
    attributeNamePrefix: "@",
    ignoreAttributes: false,
  });
  return builder.build({
    "?xml": { "@version": "1.0", "@encoding": "UTF-8" },
    rss: {
      "@version": "2.0",
      channel: {
        title: rss.title,
        link: rss.link,
        description: rss.description,
        language: rss.language,
        item: rss.items.map((item) => ({
          title: item.title,
          link: item.link,
          description: item.description,
          pubDate: item.date.toISOString(),
          category: item.categories.join(","),
        })),
      },
    },
  });
}

export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const posts = (
    await getBinding(context, "DB")
      .prepare(
        `
          SELECT posts.*, json_group_array(post_tags.tag) AS tags
          FROM posts
          LEFT JOIN post_tags ON posts.id = post_tags.post_id
          WHERE posts.publish
          GROUP BY posts.id
        `,
      )
      .run()
  ).results;

  const xml = genRss({
    title: "namachan10777.dev",
    description: "namachan10777's personal website and blog",
    link: url.origin,
    language: "ja",
    items: v.parse(v.array(postWithTagsSchema), posts).map((post) => ({
      title: post.title,
      description: post.description,
      date: post.date,
      link: `${url.origin}/post/${post.id}/`,
      categories: post.tags,
    })),
  });
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

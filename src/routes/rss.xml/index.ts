import { type RequestHandler } from "@qwik.dev/router";
import { XMLBuilder } from "fast-xml-parser";
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

interface RssProps {
  title: string;
  description: string;
  link: string;
  items: RssItem[];
  language: string;
}

function genRss(rss: RssProps): string {
  const builder = new XMLBuilder({
    attributeNamePrefix: "@",
    ignoreAttributes: false,
  });
  const obj = {
    "?xml": {
      "@version": "1.0",
      "@encoding": "UTF-8",
    },
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
  };
  return builder.build(obj);
}

export const onGet: RequestHandler = async (event) => {
  const { request, send } = event;
  const d1 = getBinding<D1Database>(event, "DB");
  const url = new URL(request.url);
  const base = {
    title: "namachan10777.dev",
    description: "namachan10777's personal website and blog",
    link: url.origin,
    language: "ja",
    items: [],
  };
  if (d1 === undefined) {
    send(200, genRss(base));
    return;
  }

  const posts = (
    await d1
      .prepare(
        `
        SELECT posts.*, json_group_array(post_tags.tag) AS tags
        FROM posts
        LEFT JOIN post_tags ON posts.id = post_tags.post_id
        WHERE posts.publish
        GROUP BY posts.id;
      `,
      )
      .run()
  ).results;

  const xml = genRss({
    ...base,
    items: v.parse(v.array(postWithTagsSchema), posts).map((post) => {
      return {
        title: post.title,
        description: post.description,
        date: post.date,
        link: `${url.origin}/post/${post.id}/`,
        categories: post.tags,
      };
    }),
  });
  send(200, xml);
};

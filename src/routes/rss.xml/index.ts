import { type RequestHandler } from "@builder.io/qwik-city";
import { XMLBuilder } from "fast-xml-parser";
import { isPostRecords, isTags } from "~/generated";

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

export const onGet: RequestHandler = async ({ request, send, env }) => {
  const d1 = env.get("DB");
  const url = new URL(request.url);
  const base = {
    title: "namachan10777.dev",
    description: "namachan10777's personal website and blog",
    link: url.origin,
    language: "ja",
    items: [],
  };
  if (d1 === undefined) {
    genRss(base);
    return;
  }

  const posts = (
    await d1
      .prepare(
        "SELECT posts.*, json_group_array(tags.value) AS tags FROM posts LEFT JOIN tags ON posts.id = tags.id WHERE posts.publish GROUP BY posts.id;",
      )
      .run()
  ).results;

  const xml = genRss({
    ...base,
    items: isPostRecords(posts)
      ? posts.map((post) => {
          const categories = JSON.parse(post.tags);
          return {
            title: post.title,
            description: post.description,
            date: new Date(post.date),
            link: `${url.origin}/post/${post.id}/`,
            categories: isTags(categories) ? categories : [],
          };
        })
      : [],
  });
  send(200, xml);
};
